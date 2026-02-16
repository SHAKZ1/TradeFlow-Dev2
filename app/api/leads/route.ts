import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { generateUserConfig } from '@/lib/ghl-config-engine';
import { refreshUserConfig } from '@/lib/ghl/field-manager';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// --- CONCURRENCY HELPER ---
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  iterator: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // Process batch in parallel
    const batchResults = await Promise.all(batch.map(iterator));
    results.push(...batchResults);
    // Artificial delay to respect GHL Rate Limits (100ms)
    if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return results;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  let CONFIG = user.ghlConfig as any;
  
  // Version Check
  if (!CONFIG || CONFIG.version !== 9) {
      try {
          if (!CONFIG) {
              CONFIG = await generateUserConfig(locationId, token);
              await db.user.update({ where: { id: userId }, data: { ghlConfig: CONFIG } });
          } else {
              CONFIG = await refreshUserConfig(userId, locationId, token);
          }
      } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
  }

  try {
    // 1. Fetch Opportunities (Search Index)
    const response = await fetch(
      `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&pipeline_id=${CONFIG.pipelineId}`,
      { headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }, cache: 'no-store' }
    );

    if (!response.ok) {
        // Handle 429 Gracefully
        if (response.status === 429) {
            console.error("⚠️ GHL Rate Limit Hit on Search");
            return NextResponse.json({ error: "System busy, retrying..." }, { status: 429 });
        }
        return NextResponse.json({ error: await response.text() }, { status: response.status });
    }

    const data = await response.json();
    const allOpportunities = data.opportunities || [];

    const filteredOpportunities = allOpportunities.filter((opp: any) => {
        const s = opp.status ? opp.status.toLowerCase() : '';
        return s === 'open' || s === 'won' || s === 'lost';
    });

    // 2. OPTIMIZED DB FETCH (Select only needed fields to save Bandwidth)
    const opportunityIds = filteredOpportunities.map((o: any) => o.id);
    const [allQuotes, allInvoices] = await Promise.all([
        db.quote.findMany({ 
            where: { opportunityId: { in: opportunityIds } },
            select: { id: true, opportunityId: true, amount: true, method: true, status: true, createdAt: true, type: true } // <--- BANDWIDTH SAVER
        }),
        db.invoice.findMany({ 
            where: { opportunityId: { in: opportunityIds } },
            select: { id: true, opportunityId: true, amount: true, method: true, status: true, createdAt: true } // <--- BANDWIDTH SAVER
        })
    ]);

    // 3. BATCH PROCESSING (The 429 Fix)
    // We process 5 leads at a time, max.
    const leads = await processInBatches(filteredOpportunities, 5, async (searchOpp: any) => {
      let opp = searchOpp;
      let contact = searchOpp.contact || {};

      // A. SMART DEEP FETCH
      const hasCriticalFields = opp.customFields?.some((f: any) => 
          f.id === CONFIG.customFields.depositStatus || 
          f.id === CONFIG.customFields.jobStart
      );

      if (!opp.customFields || !hasCriticalFields) {
          try {
              const liveRes = await fetch(`https://services.leadconnectorhq.com/opportunities/${searchOpp.id}`, {
                  headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }, cache: 'no-store'
              });
              if (liveRes.ok) {
                  const liveData = await liveRes.json();
                  opp = liveData.opportunity; 
                  if (liveData.opportunity.contact) contact = { ...contact, ...liveData.opportunity.contact };
              }
          } catch (e) { console.warn(`Deep fetch failed for ${opp.id}`); }
      }

      // B. Fetch LIVE Contact & Notes (Only if needed)
      let reviewText = '';
      let jobSpecs: Record<string, any> = {};

      if (contact.id) {
          try {
              // Parallelize these two calls
              const [contactRes, notesRes] = await Promise.all([
                  fetch(`https://services.leadconnectorhq.com/contacts/${contact.id}`, {
                      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }, cache: 'no-store'
                  }),
                  fetch(`https://services.leadconnectorhq.com/contacts/${contact.id}/notes`, {
                      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }, cache: 'no-store'
                  })
              ]);

              if (contactRes.ok) {
                  const contactData = await contactRes.json();
                  contact = { ...contact, ...contactData.contact };
              }

              if (notesRes.ok) {
                  const notesData = await notesRes.json();
                  let notes = notesData.notes || [];
                  // Optimization: Only parse if we actually have notes
                  if (notes.length > 0) {
                      notes = notes.sort((a: any, b: any) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
                      const cleanText = (text: string) => text.replace(/<[^>]*>?/gm, '').trim();

                      const specsNote = notes.find((n: any) => n.body && n.body.includes('JOB_SPECS:'));
                      if (specsNote) {
                          try {
                              let raw = cleanText(specsNote.body);
                              const start = raw.indexOf('{');
                              const end = raw.lastIndexOf('}');
                              if (start !== -1 && end !== -1) jobSpecs = JSON.parse(raw.substring(start, end + 1));
                          } catch (e) {}
                      }

                      const fieldNote = notes.find((n: any) => n.body && n.body.includes('FIELD_NOTES:'));
                      if (fieldNote) opp.notes = cleanText(fieldNote.body).replace('FIELD_NOTES:', '').trim();

                      const reviewNote = notes.find((n: any) => n.body && n.body.includes('REVIEW_CONTENT:'));
                      if (reviewNote) reviewText = cleanText(reviewNote.body).replace('REVIEW_CONTENT:', '').trim();
                  }
              }
          } catch (e) { }
      }

      // C. Match History
      const leadQuotes = allQuotes.filter(q => q.opportunityId === opp.id);
      const leadInvoices = allInvoices.filter(i => i.opportunityId === opp.id);

      const safePhone = contact.phone || opp.contact?.phone || 'No Phone';
      const safeEmail = contact.email || opp.contact?.email || 'No Email';

      const quoteHistory = leadQuotes.map(q => ({
          id: q.id, type: q.type, amount: q.amount, method: q.method, status: q.status, date: q.createdAt.toISOString(), target: q.method === 'sms' ? safePhone : safeEmail
      }));

      const invoiceHistory = leadInvoices.map(i => ({
          id: i.id, amount: i.amount, method: i.method, status: i.status, date: i.createdAt.toISOString(), target: i.method === 'sms' ? safePhone : safeEmail
      }));

      // D. Mapping
      const getField = (key: string) => {
        const fieldConfig = CONFIG.customFields?.[key];
        if (!fieldConfig || !fieldConfig.id) return null;
        if (fieldConfig.model === 'opportunity') {
            const field = opp.customFields?.find((f: any) => f.id === fieldConfig.id);
            return field?.value !== undefined ? field.value : (field?.fieldValue !== undefined ? field.fieldValue : null);
        }
        if (fieldConfig.model === 'contact') {
            const field = contact.customFields?.find((f: any) => f.id === fieldConfig.id);
            return field?.value !== undefined ? field.value : (field?.fieldValue !== undefined ? field.fieldValue : null);
        }
        return null;
      };

      let fName = contact.firstName || 'New';
      let lName = contact.lastName || 'Lead';
      let email = contact.email || '';
      let phone = contact.phone || '';

      if (fName === 'New' && lName === 'Lead' && opp.name) {
         const parts = opp.name.split(' ');
         if (parts.length > 0) { fName = parts[0]; lName = parts.slice(1).join(' ') || 'Lead'; }
      }
      if (/\d/.test(fName)) { fName = "New"; lName = "Lead"; }

      const getInternalStatus = (stageId: string) => {
        const s = opp.status ? opp.status.toLowerCase() : '';
        if (s === 'lost' || s === 'abandoned') return 'lost';
        const entry = Object.entries(CONFIG.stageIds).find(([key, val]) => val === stageId);
        return entry ? entry[0] : 'new-lead';
      };

      let rawSource = opp.source || contact.source;
      if (!rawSource && contact.customFields) {
          const knownSources = ['Phone Call', 'Whatsapp', 'SMS', 'Email', 'Checkatrade', 'TrustATrader', 'Meta', 'Google Ads'];
          const foundField = contact.customFields.find((f: any) => knownSources.includes(f.value));
          if (foundField) rawSource = foundField.value;
      }
      rawSource = rawSource || 'Manual';
      if (rawSource === 'Manual' && contact.tags?.includes(CONFIG.tags?.recaptured || 'recaptured-lead')) {
          rawSource = 'Missed Call';
      }

      return {
        id: opp.id,
        contactId: contact.id,
        firstName: fName,
        lastName: lName,
        email: email,
        phone: phone,
        value: opp.monetaryValue || 0,
        status: getInternalStatus(opp.pipelineStageId),
        postcode: contact.address1 || '',
        service: getField('jobType') || '',
        depositStatus: (getField('depositStatus') || 'unpaid').toLowerCase(),
        invoiceStatus: (getField('invoiceStatus') || 'unpaid').toLowerCase(),
        reviewStatus: (getField('reviewStatus') || 'none').toLowerCase(),
        reviewRating: getField('reviewRating'),
        reviewScheduledDate: getField('reviewSchedule'),
        reviewSource: getField('reviewSource'),
        reviewText: reviewText,
        jobDate: getField('jobStart') || null,
        jobEndDate: getField('jobEnd') || null,
        reviewChannel: getField('reviewChannel'),
        source: rawSource,
        autoTexted: contact.tags?.includes(CONFIG.tags?.recaptured || 'recaptured-lead') || false,
        createdAt: opp.createdAt,
        notes: opp.notes || '',
        jobSpecs: jobSpecs,
        quoteHistory: quoteHistory,
        invoiceHistory: invoiceHistory
      };
    });

    return NextResponse.json({ leads });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}