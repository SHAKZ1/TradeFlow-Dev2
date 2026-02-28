import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function DELETE(request: Request) {
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
    const { id } = await request.json();
    console.log(`🗑️ Deleting Opportunity: ${id}`);

    const oppRes = await fetch(`https://services.leadconnectorhq.com/opportunities/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' },
    });

    if (!oppRes.ok) {
        const err = await oppRes.text();
        console.error("❌ Failed to delete Opportunity:", err);
        return NextResponse.json({ error: err }, { status: 500 });
    }

    // ==========================================
    // NEW: DELETE FROM PRISMA VAULT
    // ==========================================
    await db.lead.delete({
        where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}