import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { getMergedConfig } from '@/lib/template-parser';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let locationName = null;
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
                  locationName = ghlData.name;
              }
          } catch (e) {}
      }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace('https://', '').replace('http://', '') || 'app.tradeflow.uk';
  const forwardingAddress = user.ghlLocationId ? `trigger+${user.ghlLocationId}@${baseUrl}` : 'Connect GHL First';

  const communicationConfig = getMergedConfig(user.communicationConfig);

  return NextResponse.json({
      stripe: {
          isConnected: !!user.stripeSecretKey,
          mode: user.stripeSecretKey?.startsWith('sk_live') ? 'Live' : 'Test',
          publishableKey: user.stripePublishableKey
      },
      bank: {
          isConnected: !!(user.bankAccountName && user.bankSortCode && user.bankAccountNumber),
          name: user.bankAccountName,
          sortCode: user.bankSortCode,
          accountNumber: user.bankAccountNumber
      },
      ghl: {
          isConnected: !!user.ghlLocationId,
          locationId: user.ghlLocationId,
          locationName: locationName || 'Unknown',
          facebook: !!ghlData?.social?.facebookUrl,
          google: !!ghlData?.social?.googlePlacesId,
          instagram: !!ghlData?.social?.instagram
      },
      parser: {
          email: forwardingAddress
      },
      branding: {
          logo: user.companyLogoUrl,
          banner: user.companyBannerUrl,
          name: user.companyName,
          address: user.companyAddress,
          email: user.companyEmail,
          website: user.companyWebsite,
          niche: user.companyNiche // <--- THIS WAS MISSING
      },
      documentConfig: user.documentConfig || [],
      communicationConfig,
      costRates: user.costRates || []
  });
}

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    
    const { 
        stripeSecretKey, stripePublishableKey, 
        companyLogoUrl, companyBannerUrl,
        companyName, companyAddress, companyEmail, companyWebsite,
        companyNiche, // <--- CAPTURE THIS
        bankAccountName, bankSortCode, bankAccountNumber,
        documentConfig,
        communicationConfig,
        costRates
    } = body;

    const updateData: any = {};
    
    if (stripeSecretKey !== undefined) updateData.stripeSecretKey = stripeSecretKey;
    if (stripePublishableKey !== undefined) updateData.stripePublishableKey = stripePublishableKey;
    if (companyLogoUrl !== undefined) updateData.companyLogoUrl = companyLogoUrl;
    if (companyBannerUrl !== undefined) updateData.companyBannerUrl = companyBannerUrl;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
    if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
    if (companyWebsite !== undefined) updateData.companyWebsite = companyWebsite;
    if (companyNiche !== undefined) updateData.companyNiche = companyNiche; // <--- SAVE THIS
    if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName;
    if (bankSortCode !== undefined) updateData.bankSortCode = bankSortCode;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (documentConfig !== undefined) updateData.documentConfig = documentConfig;
    if (communicationConfig !== undefined) updateData.communicationConfig = communicationConfig;
    if (costRates !== undefined) updateData.costRates = costRates;

    await db.user.update({
        where: { id: userId },
        data: updateData
    });

    return NextResponse.json({ success: true });
}

export async function DELETE() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await db.user.update({ where: { id: userId }, data: { ghlLocationId: null } });
    return NextResponse.json({ success: true });
}