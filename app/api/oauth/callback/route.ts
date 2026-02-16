import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { saveInitialTokens } from '@/lib/ghl';
import { generateUserConfig } from '@/lib/ghl-config-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 });

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Exchange Code
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code: code,
        user_type: 'Location',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("GHL Token Error", data);
        return NextResponse.json({ error: data }, { status: 500 });
    }

    const locationId = data.locationId;
    await saveInitialTokens(locationId, data);

    // 2. RUN THE CONFIG ENGINE (The Magic)
    // This scans GHL and returns the JSON map
    const dynamicConfig = await generateUserConfig(locationId, data.access_token);

    // 3. Save Config to DB
    await db.user.update({
        where: { id: userId },
        data: { 
            ghlLocationId: locationId,
            ghlConfig: dynamicConfig as any // Cast to any to satisfy Prisma JSON type
        }
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error) {
    console.error('OAuth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}