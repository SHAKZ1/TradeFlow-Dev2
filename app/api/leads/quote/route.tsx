import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import Stripe from 'stripe';
import { renderToStream } from '@react-pdf/renderer';
import { TradeFlowPDF } from '@/lib/pdf-generator';
import { put } from '@vercel/blob';
import { getMergedConfig, parseTemplate } from '@/lib/template-parser';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  console.log("🚀 QUOTE ROUTE HIT");

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  const config = getMergedConfig(user.communicationConfig);

  try {
    const body = await request.json();
    let { contactId, opportunityId, amount, channel, type, phone, email, lead } = body;

    console.log(`📝 Processing Quote: £${amount} via ${channel}`);

    // 1. Initialize Stripe (Conditional)
    let session = null;
    if (user.stripeSecretKey) {
        try {
            const stripe = new Stripe(user.stripeSecretKey, { typescript: true });
            session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'gbp',
                        product_data: { name: `${type} Quote Deposit`, description: 'Secure Deposit Payment' },
                        unit_amount: Math.round(parseFloat(amount) * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=deposit_success`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=cancelled`,
                metadata: { locationId, contactId, opportunityId, source: 'TradeFlow', paymentType: 'deposit' }
            });
        } catch (e) {
            console.error("Stripe Session Failed:", e);
        }
    }

    // 3. SAVE TO DATABASE
    const newQuote = await db.quote.create({
        data: {
            opportunityId,
            contactId,
            amount: parseFloat(amount),
            type,
            method: channel,
            status: 'sent',
            stripeSessionId: session?.id || null,
            paymentUrl: session?.url || null
        }
    });

    const prettyLink = session ? `${process.env.NEXT_PUBLIC_BASE_URL}/pay/quote/${newQuote.id}` : null;

    // --- PDF GENERATION ---
    let pdfUrl = null;
    if (lead && config.quote.attachPdf) {
        try {
            console.log("📄 Generating PDF...");
            const stream = await renderToStream(
                <TradeFlowPDF 
                    lead={lead} 
                    user={user} 
                    type="QUOTE" 
                    amount={parseFloat(amount)} 
                    paymentUrl={prettyLink || ''} 
                    referenceId={`Q-${newQuote.id.slice(-6).toUpperCase()}`}
                />
            );
            
            const chunks: Buffer[] = [];
            // @ts-ignore
            for await (const chunk of stream) chunks.push(Buffer.from(chunk));
            const buffer = Buffer.concat(chunks);

            const blob = await put(`quotes/${newQuote.id}.pdf`, buffer, { access: 'public', addRandomSuffix: true });
            pdfUrl = blob.url;
            
            await db.quote.update({
                where: { id: newQuote.id },
                data: { pdfUrl: pdfUrl }
            });

            console.log("✅ PDF Uploaded & Saved:", pdfUrl);
        } catch (e) {
            console.error("⚠️ PDF Generation Failed (Non-Fatal):", e);
        }
    }

    // 5. Format Phone
    const formatPhone = (p?: string) => {
        if (!p) return undefined;
        let clean = p.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
        if (clean.startsWith('07')) clean = '+44' + clean.substring(1);
        if (clean.startsWith('44')) clean = '+' + clean;
        return clean;
    };
    const formattedPhone = formatPhone(phone);

    // 6. Sync Contact
    const updateBody: any = {};
    if (channel === 'sms' && formattedPhone) updateBody.phone = formattedPhone;
    if (channel === 'email' && email) updateBody.email = email;

    if (Object.keys(updateBody).length > 0) {
        const updateRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
        });
        if (!updateRes.ok) await sleep(1000);
    }

    // 7. Create GHL Note
    const noteBody = `QUOTE_LOG: Sent ${type} Quote for £${amount} via ${channel}. Status: Pending.`;
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteBody }),
    });

    // 8. Send Message
    
    // --- BANK DETAILS FORMATTING ---
    const bankDetails = user.bankAccountNumber ? 
`
Bank Transfer:
Name: ${user.bankAccountName}
Sort Code: ${user.bankSortCode}
Account Number: ${user.bankAccountNumber}` : "";

    // --- SMART LINK LOGIC ---
    // If Stripe exists, {{link}} is the Stripe URL.
    // If not, {{link}} directs them to the bank details below.
    const linkValue = prettyLink || "via Bank Transfer below";

    const variables = {
        firstName: lead?.firstName || 'Customer',
        lastName: lead?.lastName || '',
        clientName: `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim(),
        myCompany: user.companyName || 'TradeFlow',
        service: lead?.service || 'Service',
        amount: amount,
        type: type,
        link: linkValue
    };

    let messageBody = channel === 'sms' 
        ? parseTemplate(config.quote.sms, variables)
        : parseTemplate(config.quote.emailBody, variables);
    
    const subject = channel === 'email' 
        ? parseTemplate(config.quote.emailSubject, variables) 
        : undefined;

    // --- APPEND EXTRAS (SMS ONLY) ---
    if (channel === 'sms') {
        // 1. Append Bank Details (Always)
        if (bankDetails) {
            messageBody += bankDetails;
        }

        // 2. Append PDF Link (If exists)
        if (pdfUrl) {
            const vanityUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/view/quote/${newQuote.id}`;
            messageBody += `\n\nView PDF: ${vanityUrl}`;
        }
    }

    // --- EMAIL ATTACHMENTS ---
    let finalAttachments: string[] = [];
    if (channel === 'email' && pdfUrl) {
        finalAttachments = [pdfUrl];
        // For email, we might want to append bank details to the body HTML too if not present
        if (bankDetails) {
            messageBody += `<br><br><strong>Bank Transfer Details:</strong><br>Name: ${user.bankAccountName}<br>Sort Code: ${user.bankSortCode}<br>Account Number: ${user.bankAccountNumber}`;
        }
    }

    console.log(`📤 Sending ${channel} to GHL...`);

    const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contactId: contactId,
            type: channel === 'sms' ? 'SMS' : 'Email',
            mobile: channel === 'sms' ? formattedPhone : undefined,
            email: channel === 'email' ? email : undefined,
            message: channel === 'sms' ? messageBody : undefined,
            subject: subject,
            html: channel === 'email' ? messageBody : undefined,
            attachments: finalAttachments
        }),
    });

    if (!msgRes.ok) {
        const errText = await msgRes.text();
        console.error("❌ GHL Message Failed:", errText);
        throw new Error(errText);
    }

    console.log("✅ Quote Sent Successfully");
    return NextResponse.json({ success: true, url: session?.url || null });

  } catch (error: any) {
    console.error("🚨 Quote Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}