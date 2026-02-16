import { db } from '@/lib/db';

interface FieldConfig {
    id: string;
    model: 'contact' | 'opportunity';
}

export async function ensureCustomField(
    locationId: string, 
    token: string, 
    fieldName: string, 
    preferredModel: 'contact' | 'opportunity' = 'opportunity'
): Promise<FieldConfig | null> {
    
    // 1. FETCH BOTH CONTACT AND OPPORTUNITY FIELDS
    const [contactRes, oppRes] = await Promise.all([
        fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields?model=contact`, {
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
        }),
        fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields?model=opportunity`, {
            headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
        })
    ]);
    
    const contactData = contactRes.ok ? await contactRes.json() : { customFields: [] };
    const oppData = oppRes.ok ? await oppRes.json() : { customFields: [] };

    // 2. SEARCH STRATEGY
    let existing;
    
    if (preferredModel === 'opportunity') {
        existing = oppData.customFields?.find((f: any) => f.name === fieldName);
        if (existing) return { id: existing.id, model: 'opportunity' };
    } else {
        existing = contactData.customFields?.find((f: any) => f.name === fieldName);
        if (existing) return { id: existing.id, model: 'contact' };
    }

    // 3. CREATE (If missing)
    console.log(`🛠️ Creating Fresh Field: ${fieldName} in ${preferredModel}`);
    const createRes = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: fieldName,
            dataType: 'TEXT',
            model: preferredModel.toLowerCase() // <--- FIX: STRICT LOWERCASE
        })
    });

    if (!createRes.ok) {
        const err = await createRes.text();
        console.error(`❌ Failed to create field ${fieldName}:`, err);
        return null;
    }

    const newData = await createRes.json();
    return { id: newData.customField.id, model: preferredModel };
}

export async function refreshUserConfig(userId: string, locationId: string, token: string) {
    // GOLDEN SCHEMA (Version 9)
    const schema: Record<string, { name: string, model: 'contact' | 'opportunity' }> = {
        // Identity
        jobFirstName: { name: 'TF_First_Name', model: 'opportunity' },
        jobLastName: { name: 'TF_Last_Name', model: 'opportunity' },
        jobEmail: { name: 'TF_Email', model: 'opportunity' },
        jobPhone: { name: 'TF_Phone', model: 'opportunity' },

        // Job Data
        jobType: { name: 'TF_Service_Type', model: 'opportunity' },
        
        // Statuses
        depositStatus: { name: 'TF_Deposit_Status', model: 'opportunity' },
        invoiceStatus: { name: 'TF_Invoice_Status', model: 'opportunity' },
        
        // Reviews
        reviewStatus: { name: 'TF_Review_Status', model: 'opportunity' },
        reviewRating: { name: 'TF_Review_Rating', model: 'opportunity' },
        reviewChannel: { name: 'TF_Review_Channel', model: 'opportunity' },
        reviewSource: { name: 'TF_Review_Source', model: 'opportunity' },
        
        // Dates
        jobStart: { name: 'TF_Job_Start', model: 'opportunity' },
        jobEnd: { name: 'TF_Job_End', model: 'opportunity' },
        reviewSchedule: { name: 'TF_Review_Schedule', model: 'opportunity' }
    };

    const newConfig: any = { customFields: {}, version: 9 }; // Bump Version

    // Resolve all IDs
    for (const [key, def] of Object.entries(schema)) {
        try {
            const fieldConfig = await ensureCustomField(locationId, token, def.name, def.model);
            if (fieldConfig) {
                newConfig.customFields[key] = fieldConfig;
            }
        } catch (e) {
            console.error(`Skipping field ${def.name} due to error.`);
        }
    }

    // Preserve existing pipeline/stage IDs
    const user = await db.user.findUnique({ where: { id: userId } });
    const currentConfig = user?.ghlConfig as any || {};

    const finalConfig = {
        ...currentConfig,
        customFields: {
            ...currentConfig.customFields,
            ...newConfig.customFields
        },
        version: 9
    };

    await db.user.update({
        where: { id: userId },
        data: { ghlConfig: finalConfig }
    });

    console.log("✅ Config Refreshed & Fresh Fields Provisioned (V9)");
    return finalConfig;
}