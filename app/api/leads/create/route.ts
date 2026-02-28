import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { refreshUserConfig } from '@/lib/ghl/field-manager';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account Connected' }, { status: 400 });
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });

  // --- USE DYNAMIC CONFIG ---
  let CONFIG = user.ghlConfig as any;
  if (!CONFIG || CONFIG.version !== 9) {
      try {
          CONFIG = await refreshUserConfig(userId, locationId, token);
      } catch (e) {
          console.error("Config Upgrade Failed:", e);
          return NextResponse.json({ error: 'Configuration Error' }, { status: 400 });
      }
  }

  try {
    const lead = await request.json();
    let contactId = lead.contactId;

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
    const safeVal = (val: any) => val === null || val === undefined ? '' : String(val);
    
    const dataMap: Record<string, string> = {
        jobType: safeVal(lead.service),
        depositStatus: 'Unpaid',
        invoiceStatus: 'Unpaid',
        reviewStatus: 'None',
        jobFirstName: fName,
        jobLastName: lName,
        jobEmail: safeVal(lead.email),
        jobPhone: safeVal(lead.phone),
    };

    const oppCustomFields: any[] =[];
    Object.entries(dataMap).forEach(([key, value]) => {
        const fieldConfig = CONFIG.customFields?.[key];
        if (fieldConfig && fieldConfig.id && fieldConfig.model === 'opportunity') {
            oppCustomFields.push({ id: fieldConfig.id, value: value });
        }
    });

    const stageId = CONFIG.stageIds[lead.status] || CONFIG.stageIds['new-lead'];

    const oppRes = await fetch(`https://services.leadconnectorhq.com/opportunities/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pipelineId: CONFIG.pipelineId,
        locationId: locationId,
        contactId: contactId,
        name: `${fName} ${lName}`,
        pipelineStageId: stageId,
        status: "open",
        monetaryValue: lead.value || 0,
        source: lead.source || 'Manual',
        customFields: oppCustomFields
      }),
    });

    if (!oppRes.ok) throw new Error("Opportunity Creation Failed: " + await oppRes.text());
    
    const oppData = await oppRes.json();
    const newOppId = oppData.opportunity.id;

    // 3. SAVE BOOKINGS TO PRISMA
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

    return NextResponse.json({ success: true, newId: newOppId, contactId: contactId });

  } catch (error: any) {
    console.error("Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}