import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  // --- USE DYNAMIC CONFIG ---
  const CONFIG = user.ghlConfig as any;
  if (!CONFIG) return NextResponse.json({ error: 'Config missing' }, { status: 400 });

  try {
    const { leadId, newStatus } = await request.json();

    const stageId = CONFIG.stageIds[newStatus];
    if (!stageId) return NextResponse.json({ error: 'Invalid Stage' }, { status: 400 });

    const status = newStatus === 'previous-jobs' ? 'won' : 'open';

    const response = await fetch(`https://services.leadconnectorhq.com/opportunities/${leadId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pipelineStageId: stageId,
        status: status 
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    // ==========================================
    // NEW: UPDATE PRISMA VAULT
    // ==========================================
    await db.lead.update({
        where: { id: leadId },
        data: { status: newStatus }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}