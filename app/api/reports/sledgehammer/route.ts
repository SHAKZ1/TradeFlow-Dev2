import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { generateUserConfig } from '@/lib/ghl-config-engine';
import { 
    calculateFinancials, 
    generateDualForecast, 
    getPreviousPeriod, 
    calculateWinRate,
    generateCashFlowSeries,
    DateRange 
} from '@/lib/analytics/math';
import { geocodePostcodes } from '@/lib/analytics/geocoder';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ... (Keep AnalyticsLead interface) ...
interface AnalyticsLead {
  id: string;
  contactId: string;
  name: string;
  value: number;
  stage: string;
  ghlStatus: string;
  createdAt: string;
  updatedAt: string;
  jobDate: string | null;
  jobEndDate: string | null;
  postcode: string | null;
  source: string;
  depositStatus: string;
  invoiceStatus: string;
  reviewStatus: string;
  isReconciled: boolean;
  service: string;
}

export async function GET(request: Request) {
  // ... (Keep Auth & Config Logic same as before) ...
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ghlLocationId) return NextResponse.json({ error: 'No GHL Account' }, { status: 400 });

  const locationId = user.ghlLocationId;
  const token = await getAccessToken(locationId);
  if (!token) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const now = new Date();
  const currentPeriod: DateRange = {
      from: fromParam ? parseISO(fromParam) : startOfMonth(now),
      to: toParam ? parseISO(toParam) : endOfMonth(now)
  };
  const previousPeriod = getPreviousPeriod(currentPeriod);

  let CONFIG = user.ghlConfig as any;
  if (!CONFIG) {
      try {
          CONFIG = await generateUserConfig(locationId, token);
          await db.user.update({ where: { id: userId }, data: { ghlConfig: CONFIG } });
      } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
  }

  try {
    // 1. FETCH ALL DATA
    const [oppsRes, expenses, quotes, invoices] = await Promise.all([
        fetch(
            `https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&pipeline_id=${CONFIG.pipelineId}`,
            { headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }, cache: 'no-store' }
        ),
        db.jobExpense.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        db.quote.findMany({ where: { status: 'paid' } }),
        db.invoice.findMany({ where: { status: 'paid' } })
    ]);

    if (!oppsRes.ok) throw new Error("Failed to fetch GHL Data");
    const oppsData = await oppsRes.json();
    const rawLeads = oppsData.opportunities || [];

    // 2. NORMALIZE & RECONCILE LEADS
    const allLeads: AnalyticsLead[] = rawLeads.map((opp: any) => {
        const stageKey = Object.entries(CONFIG.stageIds).find(([k, v]) => v === opp.pipelineStageId)?.[0] || 'new-lead';
        const ghlStatus = (opp.status || 'open').toLowerCase();
        
        let source = opp.source || 'Manual';
        if (source.toLowerCase().includes('google')) source = 'Google Ads';
        if (source.toLowerCase().includes('facebook') || source.toLowerCase().includes('meta')) source = 'Meta';
        if (source.toLowerCase().includes('checkatrade')) source = 'Checkatrade';
        if (source.toLowerCase().includes('trustatrader')) source = 'TrustATrader';

        const getField = (id: string) => {
            if (!id) return null;
            const field = opp.customFields?.find((f: any) => f.id === id);
            return field?.value !== undefined ? field.value : (field?.fieldValue !== undefined ? field.fieldValue : null);
        };

        let name = opp.name;
        if (opp.contact && opp.contact.name) {
             if (!name || name === 'New Lead' || name === 'Opportunity') name = opp.contact.name;
        }

        const leadQuotes = quotes.filter(q => q.opportunityId === opp.id);
        const leadInvoices = invoices.filter(i => i.opportunityId === opp.id);
        const bankedValue = leadQuotes.reduce((sum, q) => sum + q.amount, 0) + leadInvoices.reduce((sum, i) => sum + i.amount, 0);

        const realValue = bankedValue > 0 ? bankedValue : (opp.monetaryValue || 0);
        const isReconciled = bankedValue > 0;

        return {
            id: opp.id,
            contactId: opp.contact?.id || opp.contactId,
            name: name || 'Unknown',
            value: realValue,
            stage: stageKey,
            ghlStatus: ghlStatus,
            createdAt: opp.createdAt,
            updatedAt: opp.updatedAt,
            jobDate: getField(CONFIG.customFields.jobStart) || null,
            jobEndDate: getField(CONFIG.customFields.jobEnd) || null,
            postcode: opp.contact?.address1 || null,
            source: source,
            depositStatus: (getField(CONFIG.customFields.depositStatus) || 'unpaid').toLowerCase(),
            invoiceStatus: (getField(CONFIG.customFields.invoiceStatus) || 'unpaid').toLowerCase(),
            reviewStatus: (getField(CONFIG.customFields.reviewStatus) || 'none').toLowerCase(),
            service: getField(CONFIG.customFields.jobType) || 'Service',
            isReconciled
        };
    });

    // 3. FILTERING
    const validLeads = allLeads.filter(l => l.contactId && l.name !== 'Unknown' && l.ghlStatus !== 'lost' && l.ghlStatus !== 'abandoned');
    const lostLeadsList = allLeads.filter(l => l.ghlStatus === 'lost' || l.ghlStatus === 'abandoned');

    const currentLeads = validLeads.filter(l => isWithinInterval(new Date(l.createdAt), { start: currentPeriod.from, end: currentPeriod.to }));
    const prevLeads = validLeads.filter(l => isWithinInterval(new Date(l.createdAt), { start: previousPeriod.from, end: previousPeriod.to }));

    const currentExpenses = expenses.filter(e => isWithinInterval(e.createdAt, { start: currentPeriod.from, end: currentPeriod.to }));
    const prevExpenses = expenses.filter(e => isWithinInterval(e.createdAt, { start: previousPeriod.from, end: previousPeriod.to }));

    const currentQuotes = quotes.filter(q => q.paidAt && isWithinInterval(new Date(q.paidAt), { start: currentPeriod.from, end: currentPeriod.to }));
    const currentInvoices = invoices.filter(i => i.paidAt && isWithinInterval(new Date(i.paidAt), { start: currentPeriod.from, end: currentPeriod.to }));
    
    const prevQuotes = quotes.filter(q => q.paidAt && isWithinInterval(new Date(q.paidAt), { start: previousPeriod.from, end: previousPeriod.to }));
    const prevInvoices = invoices.filter(i => i.paidAt && isWithinInterval(new Date(i.paidAt), { start: previousPeriod.from, end: previousPeriod.to }));

    // 4. CALCULATIONS
    const mapForMath = (list: AnalyticsLead[]) => list.map(l => ({ ...l, status: l.stage }));
    const currentStats = calculateFinancials(mapForMath(currentLeads), currentExpenses, currentQuotes, currentInvoices);
    const prevStats = calculateFinancials(mapForMath(prevLeads), prevExpenses, prevQuotes, prevInvoices);

    const currentLostCount = lostLeadsList.filter(l => isWithinInterval(new Date(l.createdAt), { start: currentPeriod.from, end: currentPeriod.to })).length;
    const prevLostCount = lostLeadsList.filter(l => isWithinInterval(new Date(l.createdAt), { start: previousPeriod.from, end: previousPeriod.to })).length;

    const getDelta = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    const financials = {
        ...currentStats,
        revenueDelta: getDelta(currentStats.revenue, prevStats.revenue),
        profitDelta: getDelta(currentStats.grossProfit, prevStats.grossProfit),
        costDelta: getDelta(currentStats.cost, prevStats.cost),
        marginDelta: Math.round(currentStats.margin - prevStats.margin),
        conversionDelta: Math.round(currentStats.conversionRate - prevStats.conversionRate),
        avgValueDelta: getDelta(currentStats.avgJobValue, prevStats.avgJobValue),
        completedDelta: getDelta(currentStats.completedJobs, prevStats.completedJobs),
        lostLeads: currentLostCount,
        lostDelta: getDelta(currentLostCount, prevLostCount)
    };

    // 5. SUBCONTRACTOR SCORECARD
    const subMap: Record<string, { name: string, payout: number, revenue: number, jobs: number, jobList: any[] }> = {};
    currentExpenses.filter(e => e.category === 'subcontractor' && e.subcontractorName).forEach(exp => {
        const name = exp.subcontractorName!;
        if (!subMap[name]) subMap[name] = { name, payout: 0, revenue: 0, jobs: 0, jobList: [] };
        subMap[name].payout += exp.amount;
        const job = validLeads.find(l => l.id === exp.opportunityId);
        if (job) {
            subMap[name].revenue += job.value; 
            subMap[name].jobs += 1;
            subMap[name].jobList.push({
                id: job.id,
                title: `${job.service} for ${job.name}`,
                pay: exp.amount,
                value: job.value,
                start: job.jobDate,
                end: job.jobEndDate,
                status: job.stage
            });
        }
    });
    const subcontractorStats = Object.values(subMap).map(s => ({
        ...s,
        roi: s.payout > 0 ? ((s.revenue - s.payout) / s.payout) * 100 : 0,
        jobList: s.jobList.sort((a, b) => (b.start ? new Date(b.start).getTime() : 0) - (a.start ? new Date(a.start).getTime() : 0))
    })).sort((a, b) => b.payout - a.payout);

    // 6. FORECAST & CASH FLOW
    const winRate = calculateWinRate(mapForMath(allLeads));
    const openLeads = validLeads.filter(l => ['new-lead', 'quote-sent', 'job-booked'].includes(l.stage) && l.depositStatus !== 'paid' && l.invoiceStatus !== 'paid');
    const forecast = generateDualForecast(mapForMath(currentLeads), mapForMath(openLeads), currentPeriod, winRate, currentQuotes, currentInvoices);
    const cashFlow = generateCashFlowSeries(mapForMath(currentLeads), currentQuotes, currentInvoices, currentPeriod);

    // 7. GEO & SOURCE (INTELLIGENT MAP FILTERING)
    // FIX: Filter leads based on JOB ACTIVITY in the period, not just creation.
    const mapLeads = validLeads.filter(l => {
        // Priority: Job End > Job Start > Created At
        const activityDate = l.jobEndDate || l.jobDate || l.createdAt;
        return isWithinInterval(new Date(activityDate), { start: currentPeriod.from, end: currentPeriod.to });
    });

    const leadsWithPostcode = mapLeads.filter((l) => l.postcode && l.value > 0);
    const mapData = await geocodePostcodes(leadsWithPostcode.map((l) => ({ postcode: l.postcode!, value: l.value })));

    const sourceMap: Record<string, any> = {};
    currentLeads.forEach((l) => {
        const s = l.source;
        if (!sourceMap[s]) sourceMap[s] = { name: s, total: 0, won: 0, revenue: 0, cost: 0 };
        sourceMap[s].total++;
        if (l.value > 0) {
            sourceMap[s].won++;
            sourceMap[s].revenue += l.value;
            const leadExpenses = currentExpenses.filter((e: any) => e.opportunityId === l.id);
            sourceMap[s].cost += leadExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        }
    });
    const sources = Object.values(sourceMap).sort((a: any, b: any) => b.profit - a.profit);

    // 8. FUNNEL
    const getStageData = (stageKey: string, dateLabel: string) => {
        const stageLeads = validLeads.filter(l => {
            const isStage = stageKey === 'job-complete' ? ['job-complete', 'previous-jobs'].includes(l.stage) : l.stage === stageKey;
            if (!isStage) return false;
            let dateToCheck = l.createdAt;
            if (stageKey === 'quote-sent') dateToCheck = l.updatedAt;
            if (stageKey === 'job-booked') dateToCheck = l.jobDate || l.updatedAt;
            if (stageKey === 'job-complete') dateToCheck = l.jobEndDate || l.updatedAt;
            return isWithinInterval(new Date(dateToCheck), { start: currentPeriod.from, end: currentPeriod.to });
        });
        return { count: stageLeads.length, value: stageLeads.reduce((sum, l) => sum + l.value, 0), leads: stageLeads };
    };
    const newLeadData = getStageData('new-lead', 'Added');
    const quoteData = getStageData('quote-sent', 'Updated');
    const bookedData = getStageData('job-booked', 'Scheduled');
    const completeData = getStageData('job-complete', 'Finished');

    const funnel = {
        stages: [
            { id: 'new-lead', label: 'New Leads', count: newLeadData.count, value: newLeadData.value, leads: newLeadData.leads, color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
            { id: 'quote-sent', label: 'Quotes Sent', count: quoteData.count, value: quoteData.value, leads: quoteData.leads, color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
            { id: 'job-booked', label: 'Jobs Booked', count: bookedData.count, value: bookedData.value, leads: bookedData.leads, color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { id: 'job-complete', label: 'Completed', count: completeData.count, value: completeData.value, leads: completeData.leads, color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' }
        ],
        diagnosis: "Healthy Flow", bottleneck: "None", reasoning: "Optimal velocity.", advice: "Keep pushing.", severity: "low"
    };

    // 9. ACTIONABLE
    const unpaidInvoices = validLeads.filter(l => ['job-booked', 'job-complete', 'previous-jobs'].includes(l.stage) && l.invoiceStatus !== 'paid').map(l => ({ id: l.id, contactId: l.contactId, name: l.name, value: l.value, date: l.createdAt }));
    const unpaidDeposits = validLeads.filter(l => ['job-booked'].includes(l.stage) && l.depositStatus !== 'paid').map(l => ({ id: l.id, contactId: l.contactId, name: l.name, value: l.value, date: l.createdAt }));
    const pendingReviews = validLeads.filter(l => ['job-complete', 'previous-jobs'].includes(l.stage) && l.reviewStatus === 'none').map(l => ({ id: l.id, contactId: l.contactId, name: l.name, value: l.value, date: l.createdAt }));

    // 10. RAW LEADS
    const minifiedLeads = currentLeads.map(l => ({
        id: l.id,
        name: l.name,
        value: l.value,
        status: l.stage,
        date: l.createdAt,
        source: l.source,
        contactId: l.contactId
    }));

    return NextResponse.json({
        financials,
        forecast,
        cashFlow,
        mapData,
        sources,
        funnel,
        subcontractorStats,
        rawLeads: minifiedLeads,
        actionable: { unpaidInvoices, unpaidDeposits, reviews: pendingReviews },
        meta: { totalLeads: allLeads.length, totalExpenses: expenses.length }
    });

  } catch (error: any) {
    console.error("Sledgehammer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}