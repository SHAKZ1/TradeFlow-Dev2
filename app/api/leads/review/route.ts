import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { getMergedConfig, parseTemplate } from '@/lib/template-parser'; // <--- IMPORT

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  // --- LOAD CONFIG ---
  const config = getMergedConfig(user.communicationConfig);

  try {
    const body = await request.json();
    const { contactId, channel, phone, email, name, service } = body;

    // Sync Contact
    const updateBody: any = {};
    if (channel === 'sms' && phone) updateBody.phone = phone;
    if (channel === 'email' && email) updateBody.email = email;

    if (Object.keys(updateBody).length > 0) {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
        });
        await sleep(1500);
    }

    // Get Review Link
    const locRes = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
    });
    const locData = await locRes.json();
    const reviewLink = locData.location.settings?.reviewLink || "https://search.google.com/local/writereview";

    // --- PREPARE MESSAGE (DYNAMIC) ---
    const variables = {
        firstName: name?.split(' ')[0] || 'Customer',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        clientName: name || 'Customer',
        myCompany: user.companyName || 'TradeFlow',
        service: service || 'project',
        link: reviewLink
    };

    const messageBody = channel === 'sms' 
        ? parseTemplate(config.review.sms, variables)
        : parseTemplate(config.review.emailBody, variables);
    
    const subject = channel === 'email' 
        ? parseTemplate(config.review.emailSubject, variables) 
        : undefined;

    const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contactId: contactId,
            type: channel === 'sms' ? 'SMS' : 'Email',
            message: channel === 'sms' ? messageBody : undefined,
            subject: subject,
            html: channel === 'email' ? messageBody : undefined
        }),
    });

    if (!msgRes.ok) throw new Error(await msgRes.text());

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Review Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}