import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { Message, Channel } from '@/app/dashboard/inbox/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('id');

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const token = await getAccessToken(user.ghlLocationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  if (!conversationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const timestamp = Date.now();
    
    const response = await fetch(
      `https://services.leadconnectorhq.com/conversations/${conversationId}/messages?limit=100&sort=desc&_=${timestamp}`,
      {
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15' },
        cache: 'no-store'
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    
    // Handle nested messages array
    const rawMessages = Array.isArray(data.messages) ? data.messages : (data.messages?.messages || []);
    
    // --- FIX: STRICT FILTERING ---
    // Only allow actual communication types. Block system events.
    const COMMUNICATION_TYPES = ['SMS', 'EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'CALL'];
    
    const messages: Message[] = rawMessages
        .filter((m: any) => {
            const type = (m.messageType || m.type || '').toUpperCase();
            // 1. Must match a valid communication channel
            const isCommunication = COMMUNICATION_TYPES.some(t => type.includes(t));
            // 2. Explicitly block known system noise just in case
            const isSystem = type.includes('ACTIVITY') || type.includes('NOTE') || type.includes('OPPORTUNITY');
            
            return isCommunication && !isSystem;
        })
        .map((m: any) => {
            let channel: Channel = 'SMS';
            
            const type = (m.messageType || m.type || '').toUpperCase();
            
            if (type.includes('EMAIL')) channel = 'Email';
            else if (type.includes('WHATSAPP')) channel = 'WhatsApp';
            else if (type.includes('FACEBOOK')) channel = 'Facebook';
            else if (type.includes('INSTAGRAM')) channel = 'Instagram';
            else if (type.includes('GOOGLE')) channel = 'Google';

            let body = m.body || '';
            if (!body && m.html) {
                body = m.html.replace(/<[^>]*>?/gm, '');
            }

            // Infer Direction
            let direction = m.direction;
            if (!direction) {
                const status = (m.status || '').toLowerCase();
                const source = (m.source || '').toLowerCase();
                if (['sent', 'delivered', 'read', 'failed', 'pending'].includes(status)) {
                    direction = 'outbound';
                } else if (['app', 'api', 'workflow', 'campaign'].includes(source)) {
                    direction = 'outbound';
                } else {
                    direction = 'inbound';
                }
            }

            return {
                id: m.id,
                body: body,
                direction: direction.toLowerCase(), 
                status: m.status || 'delivered',
                date: m.dateAdded,
                channel: channel,
                attachments: m.attachments || []
            };
        })
        .reverse(); 

    return NextResponse.json({ messages });

  } catch (error: any) {
    console.error("Message Fetch Error:", error);
    return NextResponse.json({ messages: [] });
  }
}