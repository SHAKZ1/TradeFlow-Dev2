import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GHL_CONFIG } from '../../ghl/config';
import { getAccessToken } from '@/lib/ghl';

export async function POST(request: Request) {
  // 1. AUTHENTICATE
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. GET LOCATION
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  try {
    const lead = await request.json();
    let contactId = lead.contactId;

    // Default Names
    const fName = lead.firstName?.trim() || "New";
    const lName = lead.lastName?.trim() || "Lead";

    // 1. Find/Create Contact
    if (!contactId) {
        const contactBody: any = {
            firstName: fName,
            lastName: lName,
            source: lead.source || 'Manual',
            locationId: locationId,
        };
        if (lead.email?.trim()) contactBody.email = lead.email;
        if (lead.phone?.trim()) contactBody.phone = lead.phone;
        if (lead.postcode?.trim()) contactBody.address1 = lead.postcode;

        const contactRes = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
            body: JSON.stringify(contactBody),
        });

        const contactData = await contactRes.json();
        if (contactRes.ok) {
            contactId = contactData.contact.id;
        } else {
            if (contactData.message?.includes('allow duplicated contacts') && contactData.meta?.contactId) {
                contactId = contactData.meta.contactId;
            } else {
                throw new Error("Contact Creation Failed: " + JSON.stringify(contactData));
            }
        }
    }

    // 2. Create Opportunity
    const customFields = [
        { id: GHL_CONFIG.customFields.jobType, value: lead.service || '' },
        // FIX: Initialize Dual Statuses
        { id: GHL_CONFIG.customFields.depositStatus, value: 'Unpaid' },
        { id: GHL_CONFIG.customFields.invoiceStatus, value: 'Unpaid' },
        
        { id: GHL_CONFIG.customFields.reviewStatus, value: 'None' },
        // Snapshot Identity
        { id: GHL_CONFIG.customFields.jobFirstName, value: fName },
        { id: GHL_CONFIG.customFields.jobLastName, value: lName },
        { id: GHL_CONFIG.customFields.jobEmail, value: lead.email || '' },
        { id: GHL_CONFIG.customFields.jobPhone, value: lead.phone || '' },
    ];

    const oppRes = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pipelineId: GHL_CONFIG.pipelineId,
        locationId: locationId,
        contactId: contactId,
        name: `${fName} ${lName}`,
        pipelineStageId: GHL_CONFIG.stageIds[lead.status as keyof typeof GHL_CONFIG.stageIds] || GHL_CONFIG.stageIds['new-lead'],
        status: "open",
        monetaryValue: lead.value || 0,
        source: lead.source || 'Manual',
        customFields: customFields
      }),
    });

    if (!oppRes.ok) throw new Error("Opportunity Creation Failed: " + await oppRes.text());
    
    const oppData = await oppRes.json();

    const newOppId = oppData.opportunity.id; // Get the ID from GHL response

    // ============================================================
    // NEW: SAVE BOOKINGS
    // ============================================================
    if (lead.bookings && Array.isArray(lead.bookings) && lead.bookings.length > 0) {
        await db.booking.createMany({
            data: lead.bookings.map((b: any) => ({
                opportunityId: newOppId,
                userId: userId,
                startDate: new Date(b.startDate),
                endDate: new Date(b.endDate),
                title: b.title || 'Initial Booking'
            }))
        });
    }
    // ============================================================
    
    return NextResponse.json({ success: true, newId: newOppId, contactId: contactId });

  } catch (error: any) {
    console.error("Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}