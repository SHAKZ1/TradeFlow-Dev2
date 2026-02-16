import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const token = await getAccessToken(user.ghlLocationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  try {
    const body = await request.json();
    let { contactId, message, channel, email, phone, subject, attachments } = body; // <--- ADDED ATTACHMENTS

    // --- DATA ENRICHMENT ---
    if ((channel === 'SMS' && !phone) || (channel === 'Email' && !email) || (channel === 'WhatsApp' && !phone)) {
        const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
        });
        if (contactRes.ok) {
            const contactData = await contactRes.json();
            if (!phone) phone = contactData.contact.phone;
            if (!email) email = contactData.contact.email;
        }
    }

    const formatPhone = (p?: string) => {
        if (!p) return undefined;
        let clean = p.replace(/[^0-9+]/g, '');
        if (clean.startsWith('07')) clean = '+44' + clean.substring(1);
        else if (clean.startsWith('44')) clean = '+' + clean;
        if (clean.length < 10) return undefined;
        return clean;
    };

    const payload: any = {
        contactId,
        message,
        attachments: attachments || [] // <--- PASS TO GHL
    };

    switch (channel) {
        case 'Email':
            if (!email) throw new Error("Missing Email Address");
            payload.type = 'Email';
            payload.email = email;
            payload.subject = subject || 'New Message';
            
            // FIX: EMBED IMAGES IN HTML
            let htmlBody = message.replace(/\n/g, '<br>');
            
            if (attachments && attachments.length > 0) {
                const imgTags = attachments.map((url: string) => {
                    // Check if it's an image
                    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                        return `<br><img src="${url}" style="max-width: 100%; border-radius: 8px; margin-top: 10px;" /><br>`;
                    }
                    return `<br><a href="${url}">View Attachment</a><br>`;
                }).join('');
                htmlBody += imgTags;
            }
            
            payload.html = htmlBody;
            break;
        case 'WhatsApp':
            payload.type = 'WhatsApp';
            payload.mobile = formatPhone(phone);
            break;
        case 'Facebook':
            payload.type = 'Facebook';
            break;
        case 'Instagram':
            payload.type = 'Instagram';
            break;
        case 'Google':
            payload.type = 'GoogleMyBusiness';
            break;
        default: // SMS
            const mobile = formatPhone(phone);
            if (!mobile) throw new Error("Invalid Phone for SMS");
            payload.type = 'SMS';
            payload.mobile = mobile;
            break;
    }

    console.log("🚀 Sending Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("❌ GHL Send Error:", errText);
        throw new Error(errText);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}