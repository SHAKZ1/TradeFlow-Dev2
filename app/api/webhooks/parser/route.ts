import { NextResponse } from 'next/server';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';
import { parseEmail } from '@/lib/lead-parser';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) return NextResponse.json({ error: 'Missing locationId' }, { status: 400 });

    const body = await request.json();
    const emailSubject = body.subject || "New Notification";
    const emailBody = body.body || body.message || JSON.stringify(body);

    console.log(`📨 PARSER HIT: ${emailSubject}`);

    // 1. PARSE
    const data = parseEmail(emailSubject, emailBody);
    console.log("✅ Parsed Data:", data);

    // 2. AUTHENTICATE
    const token = await getAccessToken(locationId);
    if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

    // =================================================================
    // LOGIC BRANCH: REVIEW vs LEAD
    // =================================================================

    if (data.type === 'Review') {
        // --- REVIEW LOGIC ---
        console.log("⭐ Processing Review...");
        
        // A. Find Contact by Name (Reviews rarely have phone/email in notification)
        // We use a loose search query
        const searchRes = await fetch(`https://services.leadconnectorhq.com/contacts/search?locationId=${locationId}&query=${data.firstName} ${data.lastName}`, {
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
        });
        const searchData = await searchRes.json();
        let contactId = searchData.contacts?.[0]?.id;

        if (!contactId) {
            console.log("⚠️ Reviewer not found. Creating Orphan Contact.");
            const createRes = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    source: data.source,
                    tags: ['review-orphan', data.provider.toLowerCase()]
                }),
            });
            const createData = await createRes.json();
            contactId = createData.contact?.id;
        }

        // B. Find Latest Opportunity to Attach Review
        if (contactId) {
            const oppSearch = await fetch(`https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&contact_id=${contactId}`, {
                headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
            });
            const oppData = await oppSearch.json();
            const opportunities = oppData.opportunities || [];
            
            // Sort by date desc
            opportunities.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            let targetOpp = opportunities[0]; // Default to latest

            if (targetOpp) {
                // Update Existing Opp
                await fetch(`https://services.leadconnectorhq.com/opportunities/${targetOpp.id}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customFields: [
                            { id: GHL_CONFIG.customFields.reviewStatus, value: 'Received' },
                            { id: GHL_CONFIG.customFields.reviewRating, value: data.rating || 5 },
                            { id: GHL_CONFIG.customFields.reviewSource, value: data.source }
                        ]
                    }),
                });
                console.log(`✅ Linked Review to Opportunity: ${targetOpp.name}`);
            } else {
                // Create "Review Received" Opportunity if none exists
                await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pipelineId: GHL_CONFIG.pipelineId,
                        locationId,
                        contactId,
                        name: `${data.firstName} ${data.lastName} (Review)`,
                        pipelineStageId: GHL_CONFIG.stageIds['job-complete'], // Put in Complete
                        status: "won",
                        customFields: [
                            { id: GHL_CONFIG.customFields.reviewStatus, value: 'Received' },
                            { id: GHL_CONFIG.customFields.reviewRating, value: data.rating || 5 },
                            { id: GHL_CONFIG.customFields.reviewSource, value: data.source }
                        ]
                    }),
                });
                console.log(`✅ Created New Opportunity for Review`);
            }
            
            // Add Note with Review Body
            if (data.description) {
                await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ body: `REVIEW_CONTENT: ${data.description}` }),
                });
            }
        }

        return NextResponse.json({ success: true, type: 'Review', data });
    }

    // =================================================================
    // LEAD LOGIC (Existing)
    // =================================================================
    
    if (!data.phone && !data.email) {
        return NextResponse.json({ status: 'skipped_no_data', parsed: data });
    }

    // ... (Keep existing Lead Creation Logic, just update variable names from 'lead' to 'data') ...
    // 3. FIND/CREATE CONTACT
    let contactId = null;
    const searchRes = await fetch(`https://services.leadconnectorhq.com/contacts/search?locationId=${locationId}&query=${data.phone || data.email}`, {
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
    });
    const searchData = await searchRes.json();
    
    if (searchData.contacts && searchData.contacts.length > 0) {
        contactId = searchData.contacts[0].id;
    } else {
        const createRes = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locationId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address1: data.postcode,
                source: data.source,
                tags: ['parsed-lead', data.provider.toLowerCase()]
            }),
        });
        const createData = await createRes.json();
        contactId = createData.contact?.id || createData.meta?.contactId;
    }

    if (!contactId) throw new Error("Failed to resolve Contact ID");

    // 4. CREATE OPPORTUNITY
    await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pipelineId: GHL_CONFIG.pipelineId,
            locationId,
            contactId,
            name: `${data.firstName} ${data.lastName}`,
            pipelineStageId: GHL_CONFIG.stageIds['new-lead'],
            status: "open",
            source: data.source,
            customFields: [
                { id: GHL_CONFIG.customFields.jobType, value: data.description.substring(0, 50) },
                { id: GHL_CONFIG.customFields.jobFirstName, value: data.firstName },
                { id: GHL_CONFIG.customFields.jobLastName, value: data.lastName },
                { id: GHL_CONFIG.customFields.jobEmail, value: data.email },
                { id: GHL_CONFIG.customFields.jobPhone, value: data.phone },
            ]
        }),
    });

    if (data.description) {
        await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: `PARSED_JOB_DETAILS: ${data.description}` }),
        });
    }

    return NextResponse.json({ success: true, type: 'Lead', data });

  } catch (error: any) {
    console.error("Parser Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}