// Bulk Geocoding for UK Postcodes
// Uses postcodes.io (Free, No Auth required)

export interface GeoPoint {
    postcode: string;
    lat: number;
    lng: number;
    value: number;
}

export async function geocodePostcodes(data: { postcode: string; value: number }[]): Promise<GeoPoint[]> {
    // 1. Clean and Group Data
    const cleanData = data
        .filter(d => d.postcode && d.postcode.length > 1)
        .map(d => ({ ...d, cleanPostcode: d.postcode.replace(/\s/g, '').toUpperCase() }));

    const uniquePostcodes = Array.from(new Set(cleanData.map(d => d.cleanPostcode)));
    if (uniquePostcodes.length === 0) return [];

    const results: GeoPoint[] = [];
    const failedPostcodes: string[] = [];

    // 2. BATCH REQUEST (Full Postcodes)
    const batches = [];
    const tempQueue = [...uniquePostcodes];
    while (tempQueue.length > 0) {
        batches.push(tempQueue.splice(0, 100));
    }

    for (const batch of batches) {
        try {
            const res = await fetch('https://api.postcodes.io/postcodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postcodes: batch })
            });
            
            if (res.ok) {
                const json = await res.json();
                batch.forEach(pc => {
                    const lookup = json.result.find((r: any) => r.query === pc);
                    if (lookup && lookup.result) {
                        // Success: Full Postcode found
                        const totalValue = cleanData
                            .filter(d => d.cleanPostcode === pc)
                            .reduce((sum, d) => sum + d.value, 0);

                        results.push({
                            postcode: lookup.result.postcode,
                            lat: lookup.result.latitude,
                            lng: lookup.result.longitude,
                            value: totalValue
                        });
                    } else {
                        failedPostcodes.push(pc);
                    }
                });
            } else {
                failedPostcodes.push(...batch);
            }
        } catch (e) {
            failedPostcodes.push(...batch);
        }
    }

    // 3. FALLBACK: OUTCODE LOOKUP (The Fix)
    // If "IG74NY" failed, we extract "IG7" and try that.
    // UK Postcode Logic: Outcode is everything EXCEPT the last 3 chars.
    
    const outcodesToTry = new Set<string>();
    const outcodeMap = new Map<string, string[]>(); // Map Outcode -> List of Failed Full Postcodes

    failedPostcodes.forEach(pc => {
        let outcode = pc;
        if (pc.length > 3) {
            outcode = pc.substring(0, pc.length - 3);
        }
        outcodesToTry.add(outcode);
        
        const existing = outcodeMap.get(outcode) || [];
        outcodeMap.set(outcode, [...existing, pc]);
    });

    const outcodeArray = Array.from(outcodesToTry);

    // Process outcodes in parallel
    await Promise.all(outcodeArray.map(async (outcode) => {
        try {
            const res = await fetch(`https://api.postcodes.io/outcodes/${outcode}`);
            if (res.ok) {
                const json = await res.json();
                if (json.result) {
                    // We found the sector! Now map ALL failed postcodes that belong to this sector.
                    const originals = outcodeMap.get(outcode) || [];
                    
                    originals.forEach(originalPc => {
                         const totalValue = cleanData
                            .filter(d => d.cleanPostcode === originalPc)
                            .reduce((sum, d) => sum + d.value, 0);

                        results.push({
                            postcode: originalPc, // Display the original (e.g. IG7 4NY)
                            lat: json.result.latitude, // Use sector center
                            lng: json.result.longitude,
                            value: totalValue
                        });
                    });
                }
            }
        } catch (e) {
            console.error(`Outcode lookup failed for ${outcode}`, e);
        }
    }));

    return results;
}