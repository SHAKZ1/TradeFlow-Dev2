import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { generateUserConfig } from '@/lib/ghl-config-engine';

export const maxDuration = 300; // Allow up to 5 minutes for massive accounts
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  let CONFIG = user.ghlConfig as any;
  if (!CONFIG) {
      CONFIG = await generateUserConfig(locationId, token);
      await db.user.update({ where: { id: userId }, data: { ghlConfig: CONFIG } });
  }

  try {
    let allOpportunities: any[] =[];
    
    // Start with the base URL (No 'skip' parameter)
    let fetchUrl: string | null = `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&pipeline_id=${CONFIG.pipelineId}&limit=100`;

    console.log("🚀 Starting GHL Data Extraction...");

    // 1. FETCH ALL LEADS (Cursor-based Pagination)
    while (fetchUrl) {
        // FIX: Explicitly typed 'response' as Response
        const response: Response = await fetch(fetchUrl, { 
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }, 
            cache: 'no-store' 
        });

        if (!response.ok) throw new Error(`GHL Fetch Failed: ${await response.text()}`);
        
        // FIX: Explicitly typed 'data' as any
        const data: any = await response.json();
        const opps = data.opportunities ||[];
        
        allOpportunities = [...allOpportunities, ...opps];
        
        // Check if GHL provided a URL for the next page of results
        if (data.meta && data.meta.nextPageUrl) {
            // Ensure it's an absolute URL just in case GHL returns a relative path
            fetchUrl = data.meta.nextPageUrl.startsWith('http') 
                ? data.meta.nextPageUrl 
                : `https://services.leadconnectorhq.com${data.meta.nextPageUrl}`;
        } else {
            fetchUrl = null; // No more pages, break the loop
        }
    }

    console.log(`📦 Extracted ${allOpportunities.length} total opportunities. Seeding database...`);

    let seededCount = 0;

    // 2. MAP AND UPSERT TO POSTGRES
    for (const opp of allOpportunities) {
        const contact = opp.contact || {};

        // Helper to extract custom fields safely
        const getField = (key: string) => {
            const fieldConfig = CONFIG.customFields?.[key];
            if (!fieldConfig || !fieldConfig.id) return null;
            
            if (fieldConfig.model === 'opportunity') {
                const field = opp.customFields?.find((f: any) => f.id === fieldConfig.id);
                return field?.value !== undefined ? field.value : (field?.fieldValue !== undefined ? field.fieldValue : null);
            }
            return null;
        };

        // Name Parsing
        let fName = contact.firstName || 'New';
        let lName = contact.lastName || 'Lead';
        if (fName === 'New' && lName === 'Lead' && opp.name) {
            const parts = opp.name.split(' ');
            if (parts.length > 0) { fName = parts[0]; lName = parts.slice(1).join(' ') || 'Lead'; }
        }

        // Status Mapping
        const getInternalStatus = (stageId: string) => {
            const s = opp.status ? opp.status.toLowerCase() : '';
            if (s === 'lost' || s === 'abandoned') return 'lost';
            const entry = Object.entries(CONFIG.stageIds).find(([key, val]) => val === stageId);
            return entry ? entry[0] : 'new-lead';
        };

        // Source Mapping
        let rawSource = opp.source || contact.source || 'Manual';
        if (rawSource === 'Manual' && contact.tags?.includes(CONFIG.tags?.recaptured || 'recaptured-lead')) {
            rawSource = 'Missed Call';
        }

        // Dates
        const jobStartStr = getField('jobStart');
        const jobEndStr = getField('jobEnd');
        const reviewSchedStr = getField('reviewSchedule');

        // 3. THE UPSERT (Insert if new, Update if exists)
        await db.lead.upsert({
            where: { id: opp.id },
            update: {
                // If it exists, we just update the core fields to ensure it's fresh
                status: getInternalStatus(opp.pipelineStageId),
                value: opp.monetaryValue || 0,
                depositStatus: (getField('depositStatus') || 'unpaid').toLowerCase(),
                invoiceStatus: (getField('invoiceStatus') || 'unpaid').toLowerCase(),
                reviewStatus: (getField('reviewStatus') || 'none').toLowerCase(),
                jobDate: jobStartStr ? new Date(jobStartStr) : null,
                jobEndDate: jobEndStr ? new Date(jobEndStr) : null,
            },
            create: {
                id: opp.id,
                userId: userId,
                contactId: contact.id || null,
                firstName: fName,
                lastName: lName,
                email: contact.email || '',
                phone: contact.phone || '',
                value: opp.monetaryValue || 0,
                status: getInternalStatus(opp.pipelineStageId),
                postcode: contact.address1 || '',
                service: getField('jobType') || '',
                source: rawSource,
                depositStatus: (getField('depositStatus') || 'unpaid').toLowerCase(),
                invoiceStatus: (getField('invoiceStatus') || 'unpaid').toLowerCase(),
                reviewStatus: (getField('reviewStatus') || 'none').toLowerCase(),
                reviewChannel: getField('reviewChannel'),
                reviewScheduledDate: reviewSchedStr ? new Date(reviewSchedStr) : null,
                reviewRating: getField('reviewRating') ? String(getField('reviewRating')) : null,
                reviewSource: getField('reviewSource'),
                jobDate: jobStartStr ? new Date(jobStartStr) : null,
                jobEndDate: jobEndStr ? new Date(jobEndStr) : null,
                createdAt: new Date(opp.createdAt),
            }
        });

        seededCount++;
    }

    return NextResponse.json({ 
        success: true, 
        message: "Ironclad Vault Seeded Successfully",
        totalExtractedFromGHL: allOpportunities.length,
        totalSeededToDatabase: seededCount
    });

  } catch (error: any) {
    console.error("Seeder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}