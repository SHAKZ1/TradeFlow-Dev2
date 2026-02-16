import { NextResponse } from 'next/server';
import { geocodePostcodes } from '@/lib/analytics/geocoder';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get('postcode');

  if (!postcode) return NextResponse.json({ error: 'Missing postcode param' });

  try {
    // Simulate a lead with this postcode
    const result = await geocodePostcodes([{ postcode, value: 1000 }]);
    
    return NextResponse.json({
        input: postcode,
        result: result,
        success: result.length > 0,
        message: result.length > 0 ? "Geocoding Successful" : "Geocoding Failed"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}