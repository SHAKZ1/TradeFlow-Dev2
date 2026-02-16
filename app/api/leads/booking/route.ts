import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';
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
    let { lead, start, end } = body;
    let contactId = lead.contactId;

    // Format Phone
    const formatPhone = (p?: string) => {
        if (!p) return undefined;
        let clean = p.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
        if (clean.startsWith('07')) clean = '+44' + clean.substring(1);
        if (clean.startsWith('44')) clean = '+' + clean;
        return clean;
    };
    const formattedPhone = formatPhone(lead.phone);

    // 1. Sync Contact Info
    const updateBody: any = {};
    if (formattedPhone) updateBody.phone = formattedPhone;
    if (lead.email) updateBody.email = lead.email;

    if (Object.keys(updateBody).length > 0) {
        const updateRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
        });

        // Handle potential merge/duplication error
        if (!updateRes.ok) {
            const errorData = await updateRes.json();
            if (updateRes.status === 400 && errorData.meta?.contactId) {
                contactId = errorData.meta.contactId;
                // Link new contact ID to opportunity immediately
                await fetch(`https://services.leadconnectorhq.com/opportunities/${lead.id}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contactId: contactId }),
                });
            }
        }
    }

    // 2. Update Opportunity (Dates)
    const customFields = [
      { id: GHL_CONFIG.customFields.jobStart, value: start },
      { id: GHL_CONFIG.customFields.jobEnd, value: end },
    ];

    await fetch(`https://services.leadconnectorhq.com/opportunities/${lead.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ customFields: customFields }),
    });

    // 3. Send Message
    const dateObj = new Date(start);
    const readableDate = dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const readableTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    const variables = {
        firstName: lead.firstName || 'Customer',
        lastName: lead.lastName || '',
        clientName: `${lead.firstName} ${lead.lastName}`.trim(),
        myCompany: user.companyName || 'TradeFlow',
        service: lead.service || 'Service',
        date: `${readableDate} at ${readableTime}`
    };

    const messageBody = parseTemplate(config.booking.sms, variables);

    const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contactId: contactId,
            type: 'SMS',
            message: messageBody
        }),
    });

    if (!msgRes.ok) throw new Error(await msgRes.text());

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}