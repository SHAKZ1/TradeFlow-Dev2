import { NextResponse } from 'next/server';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    console.log(`⚡ WEBHOOK HIT: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const sessionPayload = event.data.object;
        const { locationId, opportunityId, contactId, source, paymentType } = sessionPayload.metadata || {};

        console.log("🔍 Metadata Check:", { locationId, opportunityId, contactId, source, paymentType });

        // 1. Basic Validation
        if (source !== 'TradeFlow' || !locationId || !opportunityId) {
            return NextResponse.json({ received: true, status: 'ignored_invalid_metadata' });
        }

        // 2. SECURITY CHECK: Verify with Stripe
        const user = await db.user.findUnique({ where: { ghlLocationId: locationId } });
        
        if (!user || !user.stripeSecretKey) {
            console.error(`❌ No Stripe Key found for Location ${locationId}`);
            return NextResponse.json({ error: 'Security Check Failed' }, { status: 401 });
        }

        const stripe = new Stripe(user.stripeSecretKey, { typescript: true });
        
        // Retrieve the session directly from Stripe to verify authenticity & get receipt
        const session = await stripe.checkout.sessions.retrieve(sessionPayload.id, {
            expand: ['payment_intent.latest_charge']
        });

        if (session.payment_status !== 'paid') {
            console.error(`❌ Fraud Alert: Webhook said paid, but Stripe says ${session.payment_status}`);
            return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
        }

        // EXTRACT RECEIPT URL
        let receiptUrl = null;
        if (session.payment_intent && typeof session.payment_intent !== 'string') {
            const charge = session.payment_intent.latest_charge as Stripe.Charge;
            receiptUrl = charge?.receipt_url;
        }

        console.log(`💰 VERIFIED PAYMENT: £${session.amount_total! / 100} for Opp ${opportunityId}`);

        // 3. UPDATE LOCAL DB STATUS (With Receipt & Timestamp)
        const paidTimestamp = new Date(); // Capture exact moment of verification

        if (paymentType === 'deposit') {
            await db.quote.updateMany({
                where: { stripeSessionId: session.id },
                data: { 
                    status: 'paid', 
                    receiptUrl: receiptUrl,
                    paidAt: paidTimestamp // <--- SAVE TIME
                }
            });
            console.log("✅ Local Quote DB Updated to PAID");
        } else {
            await db.invoice.updateMany({
                where: { stripeSessionId: session.id },
                data: { 
                    status: 'paid', 
                    receiptUrl: receiptUrl,
                    paidAt: paidTimestamp // <--- SAVE TIME
                }
            });
            console.log("✅ Local Invoice DB Updated to PAID");
        }

        // 4. Get GHL Token
        const token = await getAccessToken(locationId);
        if (!token) {
            console.error(`❌ No token found for Location ${locationId}`);
            return NextResponse.json({ error: 'No Token' }, { status: 401 });
        }

        // 5. UPDATE GHL NOTE (History)
        if (contactId) {
            try {
                const notesRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes?limit=100`, {
                    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
                });
                
                if (notesRes.ok) {
                    const notesData = await notesRes.json();
                    const notes = notesData.notes || [];
                    const targetNote = notes.find((n: any) => n.body && n.body.includes(session.id));
                    
                    if (targetNote) {
                        const jsonMatch = targetNote.body.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const noteData = JSON.parse(jsonMatch[0]);
                            noteData.status = 'paid';
                            
                            const prefix = targetNote.body.includes('QUOTE_LOG:') ? 'QUOTE_LOG:' : 'INVOICE_LOG:';
                            const newBody = `${prefix}${JSON.stringify(noteData)}`;

                            await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes/${targetNote.id}`, {
                                method: 'PUT',
                                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                                body: JSON.stringify({ body: newBody })
                            });
                            console.log(`✅ Updated GHL Note ${targetNote.id} to PAID`);
                        }
                    }
                }
            } catch (e) {
                console.error("❌ Failed to update note status:", e);
            }
        }

        // 6. UPDATE OPPORTUNITY STATUS (DUAL FIELDS)
        const updateFields = [];

        if (paymentType === 'deposit') {
            // Update Deposit Status Field
            updateFields.push({ 
                id: GHL_CONFIG.customFields.depositStatus, 
                value: 'Paid' 
            });
            console.log("💰 Marking DEPOSIT as Paid");
        } else {
            // Update Invoice Status Field
            updateFields.push({ 
                id: GHL_CONFIG.customFields.invoiceStatus, 
                value: 'Paid' 
            });
            console.log("💰 Marking INVOICE as Paid");
        }

        await fetch(`https://services.leadconnectorhq.com/opportunities/${opportunityId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customFields: updateFields,
            }),
        });

        console.log(`✅ GHL Opportunity Updated`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Stripe Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}