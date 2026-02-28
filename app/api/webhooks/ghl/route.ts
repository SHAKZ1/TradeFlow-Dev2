import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, locationId, id } = body;

    // 1. Validate Payload
    if (!locationId || !id || !type) {
      return NextResponse.json({ received: true, status: 'ignored_missing_data' });
    }

    console.log(`⚡ GHL WEBHOOK RECEIVED: ${type} for ID: ${id}`);

    // 2. Find the Tenant (User)
    const user = await db.user.findUnique({ where: { ghlLocationId: locationId } });
    if (!user) return NextResponse.json({ received: true, status: 'ignored_no_user' });

    const CONFIG = user.ghlConfig as any;
    if (!CONFIG) return NextResponse.json({ received: true, status: 'ignored_no_config' });

    // ============================================================================
    // SCENARIO A: LEAD DELETED
    // ============================================================================
    if (type === 'OpportunityDelete') {
        await db.lead.deleteMany({ where: { id: id } });
        console.log(`🗑️ Deleted Lead ${id} from Vault`);
        return NextResponse.json({ received: true, status: 'deleted' });
    }

    // ============================================================================
    // SCENARIO B: LEAD CREATED OR UPDATED
    // ============================================================================
    if (type === 'OpportunityCreate' || type === 'OpportunityUpdate' || type === 'OpportunityStatusUpdate') {
        const token = await getAccessToken(locationId);
        if (!token) return NextResponse.json({ received: true, status: 'no_token' });

        // Fetch the absolute latest truth from GHL to ensure we don't miss nested data
        const oppRes = await fetch(`https://services.leadconnectorhq.com/opportunities/${id}`, {
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
        });

        if (!oppRes.ok) return NextResponse.json({ received: true, status: 'fetch_failed' });
        
        const oppData = await oppRes.json();
        const opp = oppData.opportunity;
        const contact = opp.contact || {};

        // --- MAPPING LOGIC ---
        const getField = (key: string) => {
            const fieldConfig = CONFIG.customFields?.[key];
            if (!fieldConfig || !fieldConfig.id) return null;
            if (fieldConfig.model === 'opportunity') {
                const field = opp.customFields?.find((f: any) => f.id === fieldConfig.id);
                return field?.value !== undefined ? field.value : (field?.fieldValue !== undefined ? field.fieldValue : null);
            }
            return null;
        };

        let fName = contact.firstName || 'New';
        let lName = contact.lastName || 'Lead';
        if (fName === 'New' && lName === 'Lead' && opp.name) {
            const parts = opp.name.split(' ');
            if (parts.length > 0) { fName = parts[0]; lName = parts.slice(1).join(' ') || 'Lead'; }
        }

        const getInternalStatus = (stageId: string) => {
            const s = opp.status ? opp.status.toLowerCase() : '';
            if (s === 'lost' || s === 'abandoned') return 'lost';
            const entry = Object.entries(CONFIG.stageIds).find(([key, val]) => val === stageId);
            return entry ? entry[0] : 'new-lead';
        };

        let rawSource = opp.source || contact.source || 'Manual';
        if (rawSource === 'Manual' && contact.tags?.includes(CONFIG.tags?.recaptured || 'recaptured-lead')) {
            rawSource = 'Missed Call';
        }

        const jobStartStr = getField('jobStart');
        const jobEndStr = getField('jobEnd');
        const reviewSchedStr = getField('reviewSchedule');

        // --- UPSERT TO VAULT ---
        await db.lead.upsert({
            where: { id: opp.id },
            update: {
                contactId: contact.id || null,
                firstName: fName,
                lastName: lName,
                email: contact.email || '',
                phone: contact.phone || '',
                value: opp.monetaryValue || 0,
                status: getInternalStatus(opp.pipelineStageId),
                service: getField('jobType') || '',
                depositStatus: (getField('depositStatus') || 'unpaid').toLowerCase(),
                invoiceStatus: (getField('invoiceStatus') || 'unpaid').toLowerCase(),
                reviewStatus: (getField('reviewStatus') || 'none').toLowerCase(),
                reviewChannel: getField('reviewChannel'),
                reviewScheduledDate: reviewSchedStr ? new Date(reviewSchedStr) : null,
                reviewRating: getField('reviewRating') ? String(getField('reviewRating')) : null,
                reviewSource: getField('reviewSource'),
                jobDate: jobStartStr ? new Date(jobStartStr) : null,
                jobEndDate: jobEndStr ? new Date(jobEndStr) : null,
            },
            create: {
                id: opp.id,
                userId: user.id,
                contactId: contact.id || null,
                firstName: fName,
                lastName: lName,
                email: contact.email || '',
                phone: contact.phone || '',
                value: opp.monetaryValue || 0,
                status: getInternalStatus(opp.pipelineStageId),
                postcode: contact.address1 || '',
                service: getField('jobType') || '',
                source: rawSource,
                depositStatus: (getField('depositStatus') || 'unpaid').toLowerCase(),
                invoiceStatus: (getField('invoiceStatus') || 'unpaid').toLowerCase(),
                reviewStatus: (getField('reviewStatus') || 'none').toLowerCase(),
                reviewChannel: getField('reviewChannel'),
                reviewScheduledDate: reviewSchedStr ? new Date(reviewSchedStr) : null,
                reviewRating: getField('reviewRating') ? String(getField('reviewRating')) : null,
                reviewSource: getField('reviewSource'),
                jobDate: jobStartStr ? new Date(jobStartStr) : null,
                jobEndDate: jobEndStr ? new Date(jobEndStr) : null,
                createdAt: new Date(opp.createdAt),
            }
        });

        console.log(`✅ Synced Lead ${opp.id} to Vault`);
        return NextResponse.json({ received: true, status: 'upserted' });
    }

    // ============================================================================
    // SCENARIO C: CONTACT UPDATED (Syncs Name/Email/Phone across all their jobs)
    // ============================================================================
    if (type === 'ContactUpdate') {
        const token = await getAccessToken(locationId);
        if (!token) return NextResponse.json({ received: true, status: 'no_token' });

        const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${id}`, {
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
        });

        if (contactRes.ok) {
            const contactData = await contactRes.json();
            const contact = contactData.contact;
            
            await db.lead.updateMany({
                where: { contactId: id, userId: user.id },
                data: {
                    firstName: contact.firstName || 'New',
                    lastName: contact.lastName || 'Lead',
                    email: contact.email || '',
                    phone: contact.phone || '',
                    postcode: contact.address1 || ''
                }
            });
            console.log(`✅ Synced Contact ${id} across all their leads`);
        }
        return NextResponse.json({ received: true, status: 'contact_synced' });
    }

    return NextResponse.json({ received: true, status: 'ignored_unhandled_type' });

  } catch (error: any) {
    console.error("GHL Webhook Error:", error);
    // Always return 200 to webhooks so GHL doesn't retry and spam the server
    return NextResponse.json({ received: true, error: error.message });
  }
}