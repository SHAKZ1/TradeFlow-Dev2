import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redis } from '@/lib/ghl'; // Import the shared redis instance
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!locationId) return NextResponse.json({ error: 'Missing locationId' }, { status: 400 });

  try {
    // 1. INSPECT REDIS
    const redisKey = `ghl:${locationId}`;
    const tokens = await redis.hgetall(redisKey);

    if (!tokens || Object.keys(tokens).length === 0) {
        return NextResponse.json({ 
            status: 'error', 
            message: 'No tokens found in Redis for this Location ID.',
            redisKey 
        });
    }

    // 2. CHECK EXPIRY
    const now = Date.now();
    const expiresAt = Number(tokens.expires_at);
    const expiresInMinutes = (expiresAt - now) / 60000;

    // 3. TEST GHL CONNECTION
    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
        headers: { 
            Authorization: `Bearer ${tokens.access_token}`, 
            Version: '2021-07-28' 
        }
    });
    
    const ghlData = await ghlResponse.json();

    return NextResponse.json({
        status: 'analysis_complete',
        redis: {
            key: redisKey,
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiresInMinutes: expiresInMinutes.toFixed(2),
            isExpired: expiresInMinutes < 0
        },
        ghlTest: {
            statusCode: ghlResponse.status,
            success: ghlResponse.ok,
            data: ghlData // This will show us the exact error from GHL if 403
        }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}