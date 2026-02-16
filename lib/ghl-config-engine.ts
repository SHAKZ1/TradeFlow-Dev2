export async function generateUserConfig(locationId: string, token: string) {
  console.log(`🧠 CONFIG ENGINE: Scanning for existing fields in ${locationId}...`);

  // 1. FETCH PIPELINES
  const pipeRes = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${locationId}`, {
    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
  });
  const pipeData = await pipeRes.json();
  
  const pipeline = pipeData.pipelines?.find((p: any) => p.name === 'TradeFlow Board') 
                || pipeData.pipelines?.find((p: any) => p.name.includes('TradeFlow')) 
                || pipeData.pipelines?.[0];
  
  if (!pipeline) throw new Error("No Pipeline Found.");

  console.log(`✅ Selected Pipeline: "${pipeline.name}"`);

  const stages = pipeline.stages || [];
  const findStage = (name: string) => stages.find((s: any) => s.name.toLowerCase().includes(name.toLowerCase()))?.id;

  const stageIds = {
    'new-lead': findStage('New') || findStage('Lead') || stages[0]?.id,
    'quote-sent': findStage('Quote') || findStage('Proposal') || stages[1]?.id,
    'job-booked': findStage('Booked') || findStage('Scheduled') || stages[2]?.id,
    'job-complete': findStage('Complete') || findStage('Done') || stages[3]?.id,
    'previous-jobs': findStage('Archive') || findStage('Previous') || stages[4]?.id,
    'lost': findStage('Lost') || findStage('Abandoned')
  };

  // 2. FETCH CUSTOM FIELDS
  const fieldRes = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customFields`, {
    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' }
  });
  const fieldData = await fieldRes.json();
  const fields = fieldData.customFields || [];

  // DEBUG: Print what we actually found to the terminal
  console.log(`🔎 GHL returned ${fields.length} custom fields.`);
  // Uncomment to see all field names in terminal:
  // console.log(fields.map((f: any) => f.name));

  // Helper to find field by Name (Case Insensitive, Partial Match)
  const findField = (names: string[]) => {
    const field = fields.find((f: any) => names.some(n => f.name.toLowerCase().trim() === n.toLowerCase().trim()));
    if (field) {
        return field.id;
    }
    console.warn(`   ⚠️ Could not find field matching: ${names.join(' OR ')}`);
    return null;
  };

  // 3. MAP FIELDS (Expanded Search Terms)
  const customFields = {
    // We DO NOT scan for Name/Email/Phone anymore. We use native Contact fields.
    
    // Job Data
    jobType: findField(['Service Type', 'Job Type', 'Service', 'TradeFlow Service Type']),
    
    // Statuses
    depositStatus: findField(['Deposit Status', 'TradeFlow Deposit Status']),
    invoiceStatus: findField(['Invoice Status', 'TradeFlow Invoice Status']),
    
    // Reviews
    reviewStatus: findField(['Review Status', 'TradeFlow Review Status']),
    reviewRating: findField(['Review Rating', 'Star Rating', 'TradeFlow Review Rating']),
    reviewChannel: findField(['Review Channel', 'TradeFlow Review Channel']),
    reviewSource: findField(['Review Source', 'TradeFlow Review Source']),
    
    // Dates
    jobStart: findField(['Job Start', 'Start Date', 'Job Date', 'TradeFlow Job Start']),
    jobEnd: findField(['Job End', 'End Date', 'TradeFlow Job End']),
    reviewSchedule: findField(['Review Schedule', 'TradeFlow Review Schedule'])
  };

  const config = {
    pipelineId: pipeline.id,
    stageIds,
    customFields,
    tags: { recaptured: "recaptured-lead" },
    version: 4 // Bump version to force update
  };

  return config;
}