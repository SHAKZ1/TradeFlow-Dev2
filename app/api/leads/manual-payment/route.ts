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

  try {
    const body = await request.json();
    const { contactId, opportunityId, amount, type, date } = body; 

    const numAmount = parseFloat(amount);
    // Use the user-selected date, or default to NOW
    const timestamp = date ? new Date(date) : new Date();

    let recordId = '';

    // 1. Save to Database
    if (type === 'deposit') {
        const record = await db.quote.create({
            data: {
                opportunityId,
                contactId,
                amount: numAmount,
                type: 'Manual Deposit',
                method: 'manual',
                status: 'paid',
                createdAt: timestamp, // Record creation time
                paidAt: timestamp     // <--- CASH FLOW TIME
            }
        });
        recordId = record.id;
    } else {
        const record = await db.invoice.create({
            data: {
                opportunityId,
                contactId,
                amount: numAmount,
                method: 'manual',
                status: 'paid',
                createdAt: timestamp, // Record creation time
                paidAt: timestamp     // <--- CASH FLOW TIME
            }
        });
        recordId = record.id;
    }

    // 2. Create GHL Note (Audit Trail)
    if (token) {
        const noteType = type === 'deposit' ? 'QUOTE_LOG' : 'INVOICE_LOG';
        const noteBody = JSON.stringify({
            id: Date.now().toString(),
            type: type === 'deposit' ? 'Manual Deposit' : 'Invoice',
            amount: numAmount,
            method: 'manual',
            date: timestamp.toISOString(),
            status: 'paid'
        });

        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: `${noteType}:${noteBody}` }),
        });
    }

    return NextResponse.json({ success: true, id: recordId });

  } catch (error: any) {
    console.error("Manual Payment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}