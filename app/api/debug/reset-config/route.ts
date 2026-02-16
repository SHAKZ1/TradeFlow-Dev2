import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Wipe the config to force a fresh scan
  await db.user.update({
    where: { id: userId },
    // FIX: Cast null to any to satisfy Prisma's strict JSON type definition
    data: { ghlConfig: null as any } 
  });

  return NextResponse.json({ success: true, message: "Config wiped. Reload dashboard to re-scan." });
}