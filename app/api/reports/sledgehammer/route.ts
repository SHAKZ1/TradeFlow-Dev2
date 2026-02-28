import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getAccessToken } from '@/lib/ghl';
import { generateUserConfig } from '@/lib/ghl-config-engine';
import { calculateFinancials, generateStaticForecast, calculatePipelineHealth, generateCashFlowSeries, DateRange } from '@/lib/analytics/math';
import { geocodePostcodes } from '@/lib/analytics/geocoder';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isBefore } from 'date-fns';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// --- RESTORED INTERFACE FOR STRICT TYPING ---
interface AnalyticsLead {
  id: string;
  contactId: string;
  name: string;
  value: number;
  stage: string;
  ghlStatus: string;
  createdAt: string;
  postcode: string | null;
  source: string;
  depositStatus: string;
  invoiceStatus: string;
  reviewStatus: string;
  service: string;
}

export async function GET(request: Request) {
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

  let CONFIG = user.ghlConfig as any;
  if (!CONFIG) {
      try {
          CONFIG = await generateUserConfig(locationId, token);
          await db.user.update({ where: { id: userId }, data: { ghlConfig: CONFIG } });
      } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
  }

  try {
    // 1. FETCH ALL DATA (Current + Historical)
    const[oppsRes, expenses, quotes, invoices] = await Promise.all([
        fetch(`https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&pipeline_id=${CONFIG.pipelineId}`,
            { headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28', Accept: 'application/json' }, cache: 'no-store' }
        ),
        db.jobExpense.findMany({ where: { userId } }),
        db.quote.findMany({ where: { contactId: { not: '' } } }), // Fetch all for historical baselining
        db.invoice.findMany({ where: { contactId: { not: '' } } })
    ]);

    if (!oppsRes.ok) throw new Error("Failed to fetch GHL Data");
    const oppsData = await oppsRes.json();
    const rawLeads = oppsData.opportunities ||[];

    // 2. NORMALIZE LEADS (APPLYING THE INTERFACE HERE FIXES THE 'ANY' ERROR)
    const allLeads: AnalyticsLead[] = rawLeads.map((opp: any) => {
        const stageKey = Object.entries(CONFIG.stageIds).find(([k, v]) => v === opp.pipelineStageId)?.[0] || 'new-lead';
        let source = opp.source || 'Manual';
        if (source.toLowerCase().includes('google')) source = 'Google Ads';
        if (source.toLowerCase().includes('facebook') || source.toLowerCase().includes('meta')) source = 'Meta';
        if (source.toLowerCase().includes('checkatrade')) source = 'Checkatrade';

        const getField = (id: string) => {
            const field = opp.customFields?.find((f: any) => f.id === id);
            return field?.value !== undefined ? field.value : (field?.fieldValue !== undefined ? field.fieldValue : null);
        };

        const leadQuotes = quotes.filter(q => q.opportunityId === opp.id);
        const leadInvoices = invoices.filter(i => i.opportunityId === opp.id);
        const bankedValue = leadQuotes.reduce((sum, q) => sum + q.amount, 0) + leadInvoices.reduce((sum, i) => sum + i.amount, 0);

        return {
            id: opp.id,
            contactId: opp.contact?.id || opp.contactId,
            name: opp.contact?.name || opp.name || 'Unknown',
            value: bankedValue > 0 ? bankedValue : (opp.monetaryValue || 0),
            stage: stageKey,
            ghlStatus: (opp.status || 'open').toLowerCase(),
            createdAt: opp.createdAt,
            postcode: opp.contact?.address1 || null,
            source: source,
            depositStatus: (getField(CONFIG.customFields.depositStatus) || 'unpaid').toLowerCase(),
            invoiceStatus: (getField(CONFIG.customFields.invoiceStatus) || 'unpaid').toLowerCase(),
            reviewStatus: (getField(CONFIG.customFields.reviewStatus) || 'none').toLowerCase(),
            service: getField(CONFIG.customFields.jobType) || 'Service',
        };
    });

    const validLeads = allLeads.filter(l => l.contactId && l.name !== 'Unknown' && l.ghlStatus !== 'lost');

    // 3. SPLIT DATA (Current vs Historical)
    const currentLeads = validLeads.filter(l => isWithinInterval(new Date(l.createdAt), { start: currentPeriod.from, end: currentPeriod.to }));
    const histLeads = validLeads.filter(l => isBefore(new Date(l.createdAt), currentPeriod.from));

    const currentExpenses = expenses.filter(e => isWithinInterval(e.createdAt, { start: currentPeriod.from, end: currentPeriod.to }));
    
    const currentQuotes = quotes.filter(q => q.paidAt && isWithinInterval(new Date(q.paidAt), { start: currentPeriod.from, end: currentPeriod.to }));
    const currentInvoices = invoices.filter(i => i.paidAt && isWithinInterval(new Date(i.paidAt), { start: currentPeriod.from, end: currentPeriod.to }));
    
    const histQuotes = quotes.filter(q => q.paidAt && isBefore(new Date(q.paidAt), currentPeriod.from));
    const histInvoices = invoices.filter(i => i.paidAt && isBefore(new Date(i.paidAt), currentPeriod.from));

    // 4. CALCULATIONS
    const financials = calculateFinancials(currentLeads, currentExpenses, currentQuotes, currentInvoices);
    const forecast = generateStaticForecast(currentQuotes, currentInvoices, histQuotes, histInvoices, currentPeriod);
    const pipelineHealth = calculatePipelineHealth(currentLeads, histLeads);
    const cashFlow = generateCashFlowSeries(currentLeads, currentQuotes, currentInvoices, currentPeriod);

    // 5. ACTIONABLE ITEMS (Flawless Logic)
    const unpaidInvoices = invoices
        .filter(i => i.status !== 'paid')
        .map(i => {
            const lead = validLeads.find(l => l.id === i.opportunityId);
            return lead ? { id: i.id, contactId: i.contactId, name: lead.name, value: i.amount, date: i.createdAt.toISOString() } : null;
        }).filter(Boolean);

    const unpaidDeposits = quotes
        .filter(q => q.status !== 'paid')
        .map(q => {
            const lead = validLeads.find(l => l.id === q.opportunityId);
            return lead ? { id: q.id, contactId: q.contactId, name: lead.name, value: q.amount, date: q.createdAt.toISOString() } : null;
        }).filter(Boolean);

    const pendingReviews = validLeads
        .filter(l =>['job-complete', 'previous-jobs'].includes(l.stage) && l.reviewStatus === 'none')
        .map(l => ({ id: l.id, contactId: l.contactId, name: l.name, value: l.value, date: l.createdAt }));

    // 6. GEO & SOURCE
    const leadsWithPostcode = currentLeads.filter(l => l.postcode && l.value > 0);
    const mapData = await geocodePostcodes(leadsWithPostcode.map(l => ({ postcode: l.postcode!, value: l.value })));

    const sourceMap: Record<string, any> = {};
    currentLeads.forEach(l => {
        const s = l.source;
        if (!sourceMap[s]) sourceMap[s] = { name: s, total: 0, won: 0, revenue: 0, cost: 0 };
        sourceMap[s].total++;
        if (l.value > 0) {
            sourceMap[s].won++;
            sourceMap[s].revenue += l.value;
            const leadExpenses = currentExpenses.filter(e => e.opportunityId === l.id);
            sourceMap[s].cost += leadExpenses.reduce((sum, e) => sum + e.amount, 0);
        }
    });
    const sources = Object.values(sourceMap).map(s => ({ ...s, profit: s.revenue - s.cost, conversion: (s.won / s.total) * 100 })).sort((a, b) => b.profit - a.profit);

    // 7. SUBCONTRACTORS
    const subMap: Record<string, any> = {};
    currentExpenses.filter(e => e.category === 'subcontractor' && e.subcontractorName).forEach(exp => {
        const name = exp.subcontractorName!;
        if (!subMap[name]) subMap[name] = { name, payout: 0, revenue: 0, jobs: 0, jobList: [] };
        subMap[name].payout += exp.amount;
        const job = validLeads.find(l => l.id === exp.opportunityId);
        if (job) {
            subMap[name].revenue += job.value; 
            subMap[name].jobs += 1;
            subMap[name].jobList.push({ id: job.id, title: `${job.service} for ${job.name}`, pay: exp.amount, value: job.value, status: job.stage });
        }
    });
    const subcontractorStats = Object.values(subMap).map(s => ({ ...s, roi: s.payout > 0 ? ((s.revenue - s.payout) / s.payout) * 100 : 0 })).sort((a, b) => b.payout - a.payout);

    return NextResponse.json({
        financials,
        forecast,
        cashFlow,
        mapData,
        sources,
        funnel: pipelineHealth,
        subcontractorStats,
        rawLeads: currentLeads,
        actionable: { unpaidInvoices, unpaidDeposits, reviews: pendingReviews }
    });

  } catch (error: any) {
    console.error("Sledgehammer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}