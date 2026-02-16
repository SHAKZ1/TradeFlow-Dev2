import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { getMergedConfig, parseTemplate } from '@/lib/template-parser';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const token = await getAccessToken(user.ghlLocationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  const config = getMergedConfig(user.communicationConfig);

  try {
    const body = await request.json();
    const { expenseId, lead } = body;

    // 1. Fetch Expense
    const expense = await db.jobExpense.findUnique({ where: { id: expenseId, userId } });
    
    if (!expense) return NextResponse.json({ error: 'Expense Not Found' }, { status: 400 });
    if (!expense.contractUrl) return NextResponse.json({ error: 'Contract Not Generated Yet' }, { status: 400 });
    if (!expense.subcontractorPhone && !expense.subcontractorEmail) {
        return NextResponse.json({ error: 'No Contact Info (Phone/Email)' }, { status: 400 });
    }

    // 2. Determine Channel (Prioritize SMS if available)
    const channel = expense.subcontractorPhone ? 'SMS' : 'Email';
    
    // 3. Format Phone (Strict)
    let mobile = undefined;
    if (expense.subcontractorPhone) {
        mobile = expense.subcontractorPhone.replace(/\s+/g, '').replace(/-/g, '');
        if (mobile.startsWith('07')) mobile = '+44' + mobile.substring(1);
        if (mobile.startsWith('44')) mobile = '+' + mobile;
    }

    // 4. Prepare Message
    const variables = {
        subName: expense.subcontractorName || 'Partner',
        service: lead.service || 'Job',
        amount: expense.amount,
        myCompany: user.companyName || 'TradeFlow',
        link: expense.contractUrl
    };

    const messageBody = parseTemplate(config.subcontractor.sms, variables);

    // 5. GHL Contact Logic
    // We search by Phone OR Email
    const query = mobile || expense.subcontractorEmail;
    const searchRes = await fetch(`https://services.leadconnectorhq.com/contacts/search?locationId=${user.ghlLocationId}&query=${query}`, {
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
    });
    const searchData = await searchRes.json();
    let contactId = searchData.contacts?.[0]?.id;

    // Create if missing
    if (!contactId) {
        const createRes = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locationId: user.ghlLocationId,
                firstName: expense.subcontractorName,
                phone: mobile,
                email: expense.subcontractorEmail,
                tags: ['subcontractor']
            }),
        });
        const createData = await createRes.json();
        contactId = createData.contact?.id;
    }

    if (!contactId) throw new Error("Could not resolve Subcontractor Contact ID");

    // 6. Send Message
    const payload: any = {
        contactId: contactId,
        type: channel,
        message: messageBody
    };

    if (channel === 'SMS') {
        payload.mobile = mobile;
    } else {
        payload.email = expense.subcontractorEmail;
        payload.subject = `Agreement: ${lead.service}`;
        payload.html = messageBody.replace(/\n/g, '<br>');
    }

    const msgRes = await fetch(`https://services.leadconnectorhq.com/conversations/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-04-15', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!msgRes.ok) {
        const err = await msgRes.text();
        console.error("GHL Send Error:", err);
        throw new Error(err);
    }

    // 7. Update Status
    await db.jobExpense.update({
        where: { id: expenseId },
        data: { status: 'sent' }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Sub Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}