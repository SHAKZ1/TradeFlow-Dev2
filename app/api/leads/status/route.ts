import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';

export async function PUT(request: Request) {
  // 1. AUTHENTICATE
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. GET LOCATION
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  try {
    const { leadId, newStatus } = await request.json();

    const stageId = GHL_CONFIG.stageIds[newStatus as keyof typeof GHL_CONFIG.stageIds];
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}