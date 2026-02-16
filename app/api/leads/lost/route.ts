import { NextResponse } from 'next/server';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';

export async function PUT(request: Request) {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) return NextResponse.json({ error: 'No Location ID' }, { status: 401 });
  const token = await getAccessToken(locationId);

  try {
    const { id } = await request.json();
    console.log(`📉 Marking Opportunity Lost: ${id}`);

    // We do NOT fetch the current stage. We do NOT send pipelineStageId.
    // We only send the status. This minimizes side effects.

    const response = await fetch(`https://services.leadconnectorhq.com/opportunities/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
          pipelineId: GHL_CONFIG.pipelineId, // Required for context
          status: 'lost' 
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ Failed to mark lost:", responseText);
      return NextResponse.json({ error: responseText }, { status: response.status });
    }

    console.log("✅ Opportunity Marked Lost:", responseText);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}