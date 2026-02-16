import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get('opportunityId');

  if (!opportunityId) return NextResponse.json({ error: 'Missing Opportunity ID' }, { status: 400 });

  try {
    const expenses = await db.jobExpense.findMany({
      where: { userId, opportunityId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ expenses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { 
        opportunityId, 
        label, 
        amount, 
        category,
        subcontractorName,
        subcontractorPhone,
        subcontractorEmail // <--- NEW
    } = body;

    const expense = await db.jobExpense.create({
      data: {
        userId,
        opportunityId,
        label,
        amount: parseFloat(amount),
        category: category || 'other',
        subcontractorName,
        subcontractorPhone,
        subcontractorEmail, // <--- SAVE
        status: category === 'subcontractor' ? 'draft' : null
      }
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    await db.jobExpense.delete({
      where: { id, userId }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}