import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import Stripe from 'stripe';
import { renderToStream } from '@react-pdf/renderer';
import { TradeFlowPDF } from '@/lib/pdf-generator';
import { put } from '@vercel/blob';
import { getMergedConfig, parseTemplate } from '@/lib/template-parser';

export async function POST(request: Request) {
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
    const { contactId, opportunityId, channel, amount, phone, email, name, lead } = body;

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
                        product_data: { name: `Invoice for ${name}`, description: 'TradeFlow Service Invoice' },
                        unit_amount: Math.round(parseFloat(amount) * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success`,
                cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=cancelled`,
                metadata: { locationId, contactId, opportunityId, source: 'TradeFlow' }
            });
        } catch (e) {
            console.error("Stripe Session Failed:", e);
        }
    }

    // 3. SAVE TO DATABASE
    const newInvoice = await db.invoice.create({
        data: {
            opportunityId,
            contactId,
            amount: parseFloat(amount),
            method: channel,
            status: 'sent',
            stripeSessionId: session?.id || null,
            paymentUrl: session?.url || null
        }
    });

    const prettyLink = session ? `${process.env.NEXT_PUBLIC_BASE_URL}/pay/invoice/${newInvoice.id}` : null;

    // --- PDF GENERATION ---
    let pdfUrl = null;
    if (lead && config.invoice.attachPdf) {
        try {
            const stream = await renderToStream(
                <TradeFlowPDF 
                    lead={lead} 
                    user={user} 
                    type="INVOICE" 
                    amount={parseFloat(amount)} 
                    paymentUrl={prettyLink || ''} 
                    referenceId={`INV-${newInvoice.id.slice(-6).toUpperCase()}`}
                />
            );
            
            const chunks: Buffer[] = [];
            // @ts-ignore
            for await (const chunk of stream) chunks.push(Buffer.from(chunk));
            const buffer = Buffer.concat(chunks);

            const blob = await put(`invoices/${newInvoice.id}.pdf`, buffer, { access: 'public', addRandomSuffix: true });
            pdfUrl = blob.url;

            await db.invoice.update({
                where: { id: newInvoice.id },
                data: { pdfUrl: pdfUrl }
            });

        } catch (e) {
            console.error("PDF Generation Failed:", e);
        }
    }

    // 5. Create GHL Note
    const noteBody = `INVOICE_LOG: Sent Invoice for £${amount} via ${channel}. Status: Pending.`;
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteBody }),
    });

    // 6. Format Phone
    let mobile = undefined;
    if (channel === 'sms' && phone) {
        mobile = phone.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
        if (mobile.startsWith('07')) mobile = '+44' + mobile.substring(1);
        if (mobile.startsWith('44')) mobile = '+' + mobile;
    }

    // 7. Prepare Message
    
    // --- BANK DETAILS FORMATTING ---
    const bankDetails = user.bankAccountNumber ? 
`
Bank Transfer:
Name: ${user.bankAccountName}
Sort Code: ${user.bankSortCode}
Account Number: ${user.bankAccountNumber}` : "";

    const linkValue = prettyLink || "via Bank Transfer below";

    const variables = {
        firstName: lead?.firstName || 'Customer',
        lastName: lead?.lastName || '',
        clientName: `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim(),
        myCompany: user.companyName || 'TradeFlow',
        service: lead?.service || 'Service',
        amount: amount,
        link: linkValue
    };

    let messageBody = channel === 'sms' 
        ? parseTemplate(config.invoice.sms, variables)
        : parseTemplate(config.invoice.emailBody, variables);
    
    const subject = channel === 'email' 
        ? parseTemplate(config.invoice.emailSubject, variables) 
        : undefined;

    // --- APPEND EXTRAS (SMS ONLY) ---
    if (channel === 'sms') {
        if (bankDetails) {
            messageBody += bankDetails;
        }
        if (pdfUrl) {
            const vanityUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/view/invoice/${newInvoice.id}`;
            messageBody += `\n\nView PDF: ${vanityUrl}`;
        }
    }

    // --- EMAIL ATTACHMENTS ---
    let finalAttachments: string[] = [];
    if (channel === 'email' && pdfUrl) {
        finalAttachments = [pdfUrl];
        if (bankDetails) {
            messageBody += `<br><br><strong>Bank Transfer Details:</strong><br>Name: ${user.bankAccountName}<br>Sort Code: ${user.bankSortCode}<br>Account Number: ${user.bankAccountNumber}`;
        }
    }

    const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contactId: contactId,
            type: channel === 'sms' ? 'SMS' : 'Email',
            mobile: channel === 'sms' ? mobile : undefined,
            email: channel === 'email' ? email : undefined,
            message: channel === 'sms' ? messageBody : undefined,
            subject: subject,
            html: channel === 'email' ? messageBody : undefined,
            attachments: finalAttachments
        }),
    });

    if (!msgRes.ok) throw new Error(await msgRes.text());

    return NextResponse.json({ success: true, url: session?.url || null });

  } catch (error: any) {
    console.error("Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}