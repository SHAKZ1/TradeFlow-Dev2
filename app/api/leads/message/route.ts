import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  try {
    const body = await request.json();
    const { contactId, channel, phone, email, message, subject } = body;

    // 1. Format Phone
    let mobile = undefined;
    if (channel === 'sms' && phone) {
        mobile = phone.replace(/[^0-9+]/g, '');
        if (mobile.startsWith('07')) mobile = '+44' + mobile.substring(1);
        else if (mobile.startsWith('44')) mobile = '+' + mobile;
    }

    // 2. Construct Payload (THE FIX)
    const payload: any = {
        contactId,
        type: channel === 'sms' ? 'SMS' : 'Email',
    };

    if (channel === 'email') {
        if (!email) throw new Error("Missing Email Address");
        payload.email = email;
        payload.subject = subject || 'New Message';
        // FIX: Pass the message content as the HTML string
        payload.html = message.replace(/\n/g, '<br>'); 
    } else {
        if (!mobile) throw new Error("Invalid Phone Number");
        payload.mobile = mobile;
        payload.message = message;
    }

    console.log("🚀 Sending Modal Message:", JSON.stringify(payload, null, 2));

    const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!msgRes.ok) {
        const err = await msgRes.text();
        console.error("GHL Error:", err);
        throw new Error(err);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Message Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}