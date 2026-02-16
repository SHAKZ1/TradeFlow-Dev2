import { NextResponse } from 'next/server';
import { GHL_CONFIG } from '../ghl/config';
import { getAccessToken } from '@/lib/ghl';

export async function POST(request: Request) {
  const locationId = process.env.GHL_LOCATION_ID;
  const token = await getAccessToken(locationId!);
  const body = await request.json();
  const { leadId, fieldId, value } = body;

  console.log(`🕵️ DEBUG: Updating Field ${fieldId} to "${value}"...`);

  const response = await fetch(`https://services.leadconnectorhq.com/opportunities/${leadId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customFields: [{ id: fieldId, value: value }]
      }),
  });

  const text = await response.text();
  console.log("👉 GHL Response:", text);

  return NextResponse.json({ status: response.status, response: text });
}