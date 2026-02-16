import { NextResponse } from 'next/server';
import { GHL_CONFIG } from '../ghl/config';
import { getAccessToken } from '@/lib/ghl';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🔔 WEBHOOK RECEIVED:", body.type);

    const locationId = process.env.GHL_LOCATION_ID;
    const token = await getAccessToken(locationId!);

    // =================================================================
    // 1. HANDLE REVIEWS (Google, Yelp, etc.)
    // =================================================================
    if (body.type === 'ReviewReceived' || body.type === 'Review') {
        const { contact_id, rating, source } = body;
        console.log(`⭐ ${source || 'Unknown'} Review: ${rating} Stars from Contact ${contact_id}`);

        // A. Fetch ALL Opportunities for this Contact
        const searchRes = await fetch(
            `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contact_id}&pipeline_id=${GHL_CONFIG.pipelineId}`,
            {
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
            }
        );
        const searchData = await searchRes.json();
        let opportunities = searchData.opportunities || [];

        // B. Sort by Date Descending (Newest First)
        opportunities = opportunities.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // C. Smart Match Logic
        let targetOpp = null;

        // Priority 1: Find the job where we explicitly ASKED for a review
        targetOpp = opportunities.find((opp: any) => {
            const statusField = opp.customFields?.find((f: any) => f.id === GHL_CONFIG.customFields.reviewStatus);
            const val = statusField?.value || statusField?.fieldValue;
            return val === 'Sent' || val === 'Scheduled';
        });

        // Priority 2: If no request found, assume it's for the most recent 'Won' (Completed) job
        if (!targetOpp) {
            targetOpp = opportunities.find((opp: any) => opp.status === 'won');
        }

        // Priority 3: Fallback to the absolute latest interaction
        if (!targetOpp && opportunities.length > 0) {
            targetOpp = opportunities[0];
        }

        if (targetOpp) {
            console.log(`✅ Review Match: Linking to Opportunity "${targetOpp.name}" (${targetOpp.id})`);
            
            await fetch(`https://services.leadconnectorhq.com/opportunities/${targetOpp.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customFields: [
                        { id: GHL_CONFIG.customFields.reviewRating, value: rating },
                        { id: GHL_CONFIG.customFields.reviewStatus, value: 'Sent' }, // Mark as done
                        { id: GHL_CONFIG.customFields.reviewSource, value: source || 'Google' } // Save platform
                    ]
                }),
            });
        } else {
            console.warn("⚠️ No Opportunity found for this Contact's review.");
        }
    }

    // =================================================================
    // 2. HANDLE PAYMENTS (Stripe, GHL Invoices)
    // =================================================================
    if (body.type === 'PaymentReceived' || body.type === 'InvoicePaid') {
        const { contact_id, amount } = body;
        console.log(`💰 Payment Received: ${amount} from Contact ${contact_id}`);

        // A. Fetch ALL Opportunities
        const searchRes = await fetch(
            `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contact_id}&pipeline_id=${GHL_CONFIG.pipelineId}`,
            { headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' } }
        );
        const searchData = await searchRes.json();
        let opportunities = searchData.opportunities || [];
        
        // B. Sort by Date Descending
        opportunities = opportunities.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // C. Smart Match Logic
        // We assume the payment is for the most recent ACTIVE job (Booked or Complete)
        // If none, we take the absolute latest.
        let targetOpp = opportunities.find((opp: any) => opp.status === 'open');
        
        if (!targetOpp && opportunities.length > 0) {
            targetOpp = opportunities[0];
        }

        if (targetOpp) {
            console.log(`✅ Payment Match: Marking Opportunity "${targetOpp.name}" as PAID`);
            
            await fetch(`https://services.leadconnectorhq.com/opportunities/${targetOpp.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customFields: [
                        // FIX: Map generic payment to Invoice Status
                        { id: GHL_CONFIG.customFields.invoiceStatus, value: 'Paid' }
                    ]
                }),
            });
        } else {
            console.warn("⚠️ No Opportunity found to attribute payment to.");
        }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}