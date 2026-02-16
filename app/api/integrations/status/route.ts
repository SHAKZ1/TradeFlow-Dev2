import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let ghlData: any = null;

  if (user.ghlLocationId) {
      const token = await getAccessToken(user.ghlLocationId);
      if (token) {
          try {
              const res = await fetch(`https://services.leadconnectorhq.com/locations/${user.ghlLocationId}`, {
                  headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
              });
              if (res.ok) {
                  const json = await res.json();
                  ghlData = json.location;
              }
          } catch (e) {
              console.error("GHL Fetch Error", e);
          }
      }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace('https://', '').replace('http://', '') || 'app.tradeflow.uk';
  const forwardingAddress = user.ghlLocationId ? `trigger+${user.ghlLocationId}@${baseUrl}` : 'Connect GHL First';

  return NextResponse.json({
      stripe: {
          isConnected: !!user.stripeSecretKey,
          mode: user.stripeSecretKey?.startsWith('sk_live') ? 'Live' : 'Test',
          publishableKey: user.stripePublishableKey
      },
      // --- FIX: RETURN BANK DATA ---
      bank: {
          isConnected: !!(user.bankAccountName && user.bankSortCode && user.bankAccountNumber),
          name: user.bankAccountName,
          sortCode: user.bankSortCode,
          accountNumber: user.bankAccountNumber
      },
      ghl: {
          isConnected: !!user.ghlLocationId,
          locationId: user.ghlLocationId,
          locationName: ghlData?.name || 'Unknown',
          facebook: !!ghlData?.social?.facebookUrl,
          google: !!ghlData?.social?.googlePlacesId,
          instagram: !!ghlData?.social?.instagram
      },
      parser: {
          email: forwardingAddress
      }
  });
}