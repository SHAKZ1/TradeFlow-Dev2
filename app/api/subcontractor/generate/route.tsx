import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import { SubcontractorAgreementPDF } from '@/lib/pdf-generator';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { expenseId, lead } = body;

    // 1. Fetch Expense Details
    const expense = await db.jobExpense.findUnique({
        where: { id: expenseId, userId }
    });

    if (!expense || !expense.subcontractorName) {
        return NextResponse.json({ error: 'Invalid Expense Record' }, { status: 400 });
    }

    // 2. Generate PDF
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const stream = await renderToStream(
        <SubcontractorAgreementPDF 
            user={user}
            lead={lead}
            subcontractor={{
                name: expense.subcontractorName,
                phone: expense.subcontractorPhone || '',
                amount: expense.amount
            }}
            date={dateStr}
        />
    );

    // 3. Upload to Blob
    const chunks: Buffer[] = [];
    // @ts-ignore
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const buffer = Buffer.concat(chunks);

    const filename = `contracts/${expense.subcontractorName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const blob = await put(filename, buffer, { access: 'public', addRandomSuffix: true });

    // 4. Update Database
    await db.jobExpense.update({
        where: { id: expenseId },
        data: { 
            contractUrl: blob.url,
            status: 'generated' // Update status
        }
    });

    return NextResponse.json({ success: true, url: blob.url });

  } catch (error: any) {
    console.error("Contract Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}