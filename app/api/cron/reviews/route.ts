import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// Helper to chunk array for batching
const chunkArray = (array: any[], size: number) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};

export async function GET(request: Request) {
  try {
    console.log("⏰ CRON STARTED: Multi-Tenant Review Check");

    const users = await db.user.findMany({
        where: { ghlLocationId: { not: null } }
    });

    console.log(`🌍 Found ${users.length} active tenants.`);
    let totalProcessed = 0;

    for (const user of users) {
        const locationId = user.ghlLocationId!;
        const token = await getAccessToken(locationId);
        if (!token) continue;

        // 1. Fetch Opportunities
        const response = await fetch(
            `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&pipeline_id=${GHL_CONFIG.pipelineId}`,
            {
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Accept': 'application/json' },
                cache: 'no-store'
            }
        );
        
        if (!response.ok) continue;

        const data = await response.json();
        const opportunities = data.opportunities || [];
        const now = new Date();

        // 2. Filter Candidates (In Memory)
        const candidates = opportunities.filter((opp: any) => {
             const fields = opp.customFields || [];
             const statusField = fields.find((f: any) => f.id === GHL_CONFIG.customFields.reviewStatus);
             const val = statusField?.value || statusField?.fieldValue;
             return val === 'Scheduled';
        });

        // 3. BATCH PROCESS (Concurrency Limit: 5)
        const batches = chunkArray(candidates, 5);

        for (const batch of batches) {
            await Promise.all(batch.map(async (searchOpp: any) => {
                try {
                    // Deep Fetch
                    const liveRes = await fetch(`https://services.leadconnectorhq.com/opportunities/${searchOpp.id}`, {
                        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
                    });
                    if (!liveRes.ok) return;
                    const liveData = await liveRes.json();
                    const opp = liveData.opportunity;
                    const contact = opp.contact;

                    const getField = (id: string) => {
                        const field = opp.customFields?.find((f: any) => f.id === id);
                        return field?.value !== undefined ? field.value : field?.fieldValue;
                    };

                    const status = getField(GHL_CONFIG.customFields.reviewStatus);
                    const dateStr = getField(GHL_CONFIG.customFields.reviewSchedule);

                    if (status !== 'Scheduled' || !dateStr) return;

                    if (new Date(dateStr) <= now) {
                        // SEND LOGIC
                        const channel = (getField(GHL_CONFIG.customFields.reviewChannel) || 'SMS').toLowerCase();
                        const service = getField(GHL_CONFIG.customFields.jobType) || 'project';
                        
                        // Get Link (Cached per user ideally, but fetching here for safety)
                        const locRes = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
                            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
                        });
                        const locData = await locRes.json();
                        const reviewLink = locData.location.settings?.reviewLink || "https://search.google.com/local/writereview";

                        let messageBody = "";
                        let subject = undefined;
                        
                        if (channel === 'sms') {
                            messageBody = `Hi ${contact.name.split(' ')[0]}, it was a pleasure working on your ${service}. We strive for perfection on every job. If you have a moment, we'd value your feedback: ${reviewLink}`;
                        } else {
                            subject = "Your project with TradeFlow";
                            messageBody = `Dear ${contact.name},\n\nThank you for choosing TradeFlow. It was a privilege to assist you with your ${service}.\n\nWe take great pride in our work and reputation. If you were satisfied with the service, would you mind sharing your experience? It helps us maintain our high standards.\n\n${reviewLink}\n\nKind regards,\nThe TradeFlow Team`;
                        }

                        const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contactId: contact.id,
                                type: channel === 'sms' ? 'SMS' : 'Email',
                                message: messageBody,
                                subject: subject
                            }),
                        });

                        if (msgRes.ok) {
                            await fetch(`https://services.leadconnectorhq.com/opportunities/${opp.id}`, {
                                method: 'PUT',
                                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    customFields: [{ id: GHL_CONFIG.customFields.reviewStatus, value: 'Sent' }]
                                }),
                            });
                            totalProcessed++;
                        }
                    }
                } catch (e) {
                    console.error(`Error processing opp ${searchOpp.id}`, e);
                }
            }));
        }
    }

    return NextResponse.json({ success: true, processed: totalProcessed });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}