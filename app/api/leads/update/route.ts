import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
// FIX: Import refreshUserConfig from the correct file (field-manager)
import { refreshUserConfig } from '@/lib/ghl/field-manager'; 

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) {
      return NextResponse.json({ error: 'Configuration Error' }, { status: 400 });
  }
  
  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  let CONFIG = user.ghlConfig as any;

  // --- VERSION 9 UPGRADE CHECK ---
  if (!CONFIG || CONFIG.version !== 9) { // <--- CHANGED TO 9
      console.log("🔄 Config Outdated. Upgrading to V9...");
      try {
          CONFIG = await refreshUserConfig(userId, locationId, token);
      } catch (e) {
          console.error("Config Upgrade Failed:", e);
      }
  }

  try {
    const lead = await request.json();
    console.log(`📝 UPDATE REQUEST for Lead ID: "${lead.id}"`);

    const safeVal = (val: any) => val === null || val === undefined ? '' : String(val);

    // --- 1. PREPARE DATA MAP ---
    const dataMap: Record<string, string> = {
        jobType: safeVal(lead.service),
        depositStatus: safeVal(lead.depositStatus),
        invoiceStatus: safeVal(lead.invoiceStatus),
        reviewStatus: safeVal(lead.reviewStatus),
        jobStart: safeVal(lead.jobDate),
        jobEnd: safeVal(lead.jobEndDate),
        reviewSchedule: safeVal(lead.reviewScheduledDate),
        reviewChannel: safeVal(lead.reviewChannel),
        jobFirstName: safeVal(lead.firstName),
        jobLastName: safeVal(lead.lastName),
        jobEmail: safeVal(lead.email),
        jobPhone: safeVal(lead.phone),
    };

    // --- 2. SPLIT PAYLOADS ---
    const contactCustomFields: any[] = [];
    const oppCustomFields: any[] = [];

    Object.entries(dataMap).forEach(([key, value]) => {
        const fieldConfig = CONFIG.customFields?.[key];
        if (fieldConfig && fieldConfig.id) {
            const payload = { id: fieldConfig.id, value: value };
            
            if (fieldConfig.model === 'contact') {
                contactCustomFields.push(payload);
            } else {
                oppCustomFields.push(payload);
            }
        }
    });

    // --- 3. UPDATE CONTACT ---
    const contactBody: any = { 
        firstName: lead.firstName, 
        lastName: lead.lastName,
        customFields: contactCustomFields 
    };
    if (lead.email?.trim()) contactBody.email = lead.email;
    if (lead.phone?.trim()) contactBody.phone = lead.phone;
    if (lead.postcode?.trim()) contactBody.address1 = lead.postcode;

    console.log(`📤 Updating Contact ${lead.contactId} with ${contactCustomFields.length} custom fields`);
    await fetch(`https://services.leadconnectorhq.com/contacts/${lead.contactId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(contactBody),
    });

    // --- 4. UPDATE OPPORTUNITY ---
    let pipelineUpdate: any = {};
    if (lead.status) {
        const stageId = CONFIG.stageIds[lead.status];
        if (stageId) {
            pipelineUpdate.pipelineStageId = stageId;
            pipelineUpdate.status = lead.status === 'previous-jobs' ? 'won' : 'open';
        }
    }

    const updateBody = {
        pipelineId: CONFIG.pipelineId,
        monetaryValue: Number(lead.value) || 0,
        name: `${lead.firstName} ${lead.lastName}`,
        customFields: oppCustomFields, 
        ...pipelineUpdate 
    };

    console.log(`📤 Updating Opportunity ${lead.id} with ${oppCustomFields.length} custom fields`);
    const oppRes = await fetch(`https://services.leadconnectorhq.com/opportunities/${lead.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody),
    });

    if (!oppRes.ok) {
        const oppText = await oppRes.text();
        console.error("❌ GHL UPDATE FAILED:", oppText);
        throw new Error(oppText);
    }

    // ==========================================
    // NEW: UPDATE PRISMA VAULT
    // ==========================================
    await db.lead.update({
        where: { id: lead.id },
        data: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            value: Number(lead.value) || 0,
            status: lead.status,
            postcode: lead.postcode,
            service: lead.service,
            depositStatus: lead.depositStatus,
            invoiceStatus: lead.invoiceStatus,
            reviewStatus: lead.reviewStatus,
            reviewChannel: lead.reviewChannel,
            reviewScheduledDate: lead.reviewScheduledDate ? new Date(lead.reviewScheduledDate) : null,
            jobDate: lead.jobDate ? new Date(lead.jobDate) : null,
            jobEndDate: lead.jobEndDate ? new Date(lead.jobEndDate) : null,
            notes: lead.notes,
            jobSpecs: lead.jobSpecs || {}
        }
    });

    if (lead.bookings && Array.isArray(lead.bookings)) {
        await db.booking.deleteMany({ where: { opportunityId: lead.id } });
        if (lead.bookings.length > 0) {
            await db.booking.createMany({
                data: lead.bookings.map((b: any) => ({
                    opportunityId: lead.id,
                    userId: userId,
                    startDate: new Date(b.startDate),
                    endDate: new Date(b.endDate),
                    title: b.title || 'Job Session'
                }))
            });
        }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}