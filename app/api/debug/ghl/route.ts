import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode'); // 'conversations' or 'messages'
  const id = searchParams.get('id'); // conversationId (only for messages mode)

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const token = await getAccessToken(user.ghlLocationId);
  
  try {
    let url = '';
    if (mode === 'messages' && id) {
        // Fetch raw messages for a specific conversation
        url = `https://services.leadconnectorhq.com/conversations/${id}/messages?limit=20&sort=desc`;
    } else {
        // Fetch raw conversation list
        url = `https://services.leadconnectorhq.com/conversations/search?locationId=${user.ghlLocationId}&limit=10&sort=desc&sortBy=last_message_date`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15' },
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json({ 
        url,
        status: response.status,
        data 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}