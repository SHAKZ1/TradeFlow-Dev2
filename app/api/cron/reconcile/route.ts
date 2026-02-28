import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { generateUserConfig } from '@/lib/ghl-config-engine';

export const maxDuration = 300; // Allow up to 5 minutes for the cron job
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. SECURITY: Ensure only Vercel (or you with the secret) can trigger this
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
  }

  console.log("🔄 CRON: Starting Nightly Reconciliation...");

  try {
    // 2. Fetch all active tenants
    const users = await db.user.findMany({
        where: { ghlLocationId: { not: null } }
    });

    let totalReconciled = 0;

    // 3. Loop through each tenant and sync their data
    for (const user of users) {
        const locationId = user.ghlLocationId!;
        const token = await getAccessToken(locationId);
        if (!token) {
            console.warn(`⚠️ Skipping user ${user.id} - Invalid Token`);
            continue;
        }

        let CONFIG = user.ghlConfig as any;
        if (!CONFIG) {
            CONFIG = await generateUserConfig(locationId, token);
            await db.user.update({ where: { id: user.id }, data: { ghlConfig: CONFIG } });
        }

        let fetchUrl: string | null = `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&pipeline_id=${CONFIG.pipelineId}&limit=100`;
        let allOpportunities: any[] =[];

        // A. Fetch all leads for this tenant (Cursor Pagination)
        while (fetchUrl) {
            const response: Response = await fetch(fetchUrl, { 
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }, 
                cache: 'no-store' 
            });

            if (!response.ok) break;
            
            const data: any = await response.json();
            allOpportunities = [...allOpportunities, ...(data.opportunities || [])];
            
            if (data.meta && data.meta.nextPageUrl) {
                fetchUrl = data.meta.nextPageUrl.startsWith('http') 
                    ? data.meta.nextPageUrl 
                    : `https://services.leadconnectorhq.com${data.meta.nextPageUrl}`;
            } else {
                fetchUrl = null;
            }
        }

        // B. Upsert all leads to the Vault
        for (const opp of allOpportunities) {
            const contact = opp.contact || {};

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

            await db.lead.upsert({
                where: { id: opp.id },
                update: {
                    status: getInternalStatus(opp.pipelineStageId),
                    value: opp.monetaryValue || 0,
                    depositStatus: (getField('depositStatus') || 'unpaid').toLowerCase(),
                    invoiceStatus: (getField('invoiceStatus') || 'unpaid').toLowerCase(),
                    reviewStatus: (getField('reviewStatus') || 'none').toLowerCase(),
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
            totalReconciled++;
        }
    }

    console.log(`✅ CRON COMPLETE: Reconciled ${totalReconciled} leads across ${users.length} tenants.`);
    return NextResponse.json({ success: true, totalReconciled, tenantsProcessed: users.length });

  } catch (error: any) {
    console.error("Reconciler Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}