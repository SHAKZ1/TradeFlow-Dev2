import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { Conversation, Channel } from '@/app/dashboard/inbox/types';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const token = await getAccessToken(user.ghlLocationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/conversations/search?locationId=${user.ghlLocationId}&limit=50&sort=desc&sortBy=last_message_date`,
      {
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15' },
        cache: 'no-store'
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const rawConversations = data.conversations ||[];

    // --- RULE 1: STRICT FILTERING (NO EMPTY HISTORIES) ---
    const validConversations = rawConversations.filter((c: any) => {
        const hasDate = !!c.lastMessageDate;
        const hasBody = c.lastMessageBody && c.lastMessageBody.trim() !== '';
        return hasDate && (hasBody || c.unreadCount > 0);
    });

    const conversations: Conversation[] = validConversations.map((c: any) => {
        const contact = c.contact || {};
        
        const activeChannels: Set<Channel> = new Set();
        
        const lastMsgType = (c.lastMessageType || '').toUpperCase();
        if (lastMsgType.includes('EMAIL')) activeChannels.add('Email');
        if (lastMsgType.includes('SMS')) activeChannels.add('SMS');
        if (lastMsgType.includes('WHATSAPP')) activeChannels.add('WhatsApp');
        if (lastMsgType.includes('FACEBOOK')) activeChannels.add('Facebook');
        if (lastMsgType.includes('INSTAGRAM')) activeChannels.add('Instagram');
        if (lastMsgType.includes('GOOGLE')) activeChannels.add('Google');

        if (contact.email) activeChannels.add('Email');
        if (contact.phone) activeChannels.add('SMS');

        const source = (contact.source || '').toLowerCase();
        if (source.includes('checkatrade')) activeChannels.add('Checkatrade');
        if (source.includes('trustatrader')) activeChannels.add('TrustATrader');

        if (activeChannels.size === 0) activeChannels.add('SMS');

        const name = c.contactName || contact.firstName || 'Unknown Lead';
        const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

        return {
            id: c.id,
            contactId: c.contactId,
            contactName: name,
            contactPhone: contact.phone,
            contactEmail: contact.email,
            lastMessageBody: c.lastMessageBody || 'Attachment',
            lastMessageDate: new Date(c.lastMessageDate).toISOString(),
            unreadCount: c.unreadCount || 0,
            channels: Array.from(activeChannels),
            tags: contact.tags ||[],
            initials
        };
    });

    // --- RULE 2: STRICT SORTING (NEWEST FIRST) ---
    conversations.sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());

    return NextResponse.json({ conversations });

  } catch (error: any) {
    console.error("Inbox Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}