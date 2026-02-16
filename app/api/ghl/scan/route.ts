import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/ghl';

export async function GET() {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) return NextResponse.json({ error: 'No Location ID' }, { status: 401 });
  const token = await getAccessToken(locationId);
  
  try {
    // Fetch Opportunity Fields
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields?model=opportunity`, {
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
    });
    const data = await response.json();
    
    // Fetch Contact Fields (Just in case)
    const response2 = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields?model=contact`, {
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
    });
    const data2 = await response2.json();

    return NextResponse.json({ 
        OPPORTUNITY_FIELDS: data.customFields.map((f: any) => ({ name: f.name, id: f.id })),
        CONTACT_FIELDS: data2.customFields.map((f: any) => ({ name: f.name, id: f.id }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}