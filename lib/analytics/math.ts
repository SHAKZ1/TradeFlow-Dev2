import { eachDayOfInterval, format, isAfter, isSameDay, differenceInDays, startOfDay, endOfDay, subDays } from "date-fns";

export interface DateRange { from: Date; to: Date; }

export interface FinancialSnapshot {
    revenue: number; cost: number; grossProfit: number; margin: number;
    conversionRate: number; avgJobValue: number; totalLeads: number;
    wonLeads: number; lostLeads: number; completedJobs: number;
}

const isConverted = (l: any) => (l.depositStatus || '').toLowerCase() === 'paid' || (l.invoiceStatus || '').toLowerCase() === 'paid';

export function getPreviousPeriod(current: DateRange): DateRange {
    const days = differenceInDays(current.to, current.from);
    const safeDays = Math.max(days, 1);
    const prevTo = subDays(current.from, 1);
    const prevFrom = subDays(prevTo, safeDays);
    return { from: startOfDay(prevFrom), to: endOfDay(prevTo) };
}

export function calculateFinancials(leads: any[], expenses: any[], paidQuotes: any[], paidInvoices: any[]): FinancialSnapshot {
    const totalLeads = leads.length;
    const wonLeadsList = leads.filter(l => isConverted(l) || l.status === 'job-complete' || l.status === 'previous-jobs');
    const wonCount = wonLeadsList.length;
    const lostCount = leads.filter(l => l.status === 'lost').length;
    const completedCount = leads.filter(l => l.status === 'job-complete' || l.status === 'previous-jobs').length;

    const quoteRevenue = paidQuotes.reduce((sum, q) => sum + (q.amount || 0), 0);
    const invoiceRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const revenue = quoteRevenue + invoiceRevenue;
    const cost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const grossProfit = revenue - cost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;
    const avgJobValue = wonCount > 0 ? revenue / wonCount : 0;

    return { revenue, cost, grossProfit, margin, conversionRate, avgJobValue, totalLeads, wonLeads: wonCount, lostLeads: lostCount, completedJobs: completedCount };
}

// --- 1. DETERMINISTIC FORECASTING (TARGET NEVER MOVES) ---
export function generateStaticForecast(
    currentPeriodQuotes: any[], currentPeriodInvoices: any[],
    historicalQuotes: any[], historicalInvoices: any[],
    dateRange: DateRange
) {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const now = new Date();
    
    // Calculate Historical Daily Velocity (All time before this period)
    const histQuoteRev = historicalQuotes.reduce((sum, q) => sum + q.amount, 0);
    const histInvRev = historicalInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalHistRev = histQuoteRev + histInvRev;
    
    // Find the first ever transaction date to determine account age
    const allHistDates =[...historicalQuotes, ...historicalInvoices].map(x => new Date(x.paidAt).getTime());
    const firstDate = allHistDates.length > 0 ? new Date(Math.min(...allHistDates)) : dateRange.from;
    const histDays = Math.max(differenceInDays(dateRange.from, firstDate), 1);
    
    const isCalibrating = histDays < 14 && totalHistRev === 0;
    const dailyTargetVelocity = isCalibrating ? 0 : (totalHistRev / histDays);

    let cumulativeActual = 0;
    let cumulativeTarget = 0;

    return {
        isCalibrating,
        data: days.map(day => {
            const isFuture = isAfter(day, now);
            const isToday = isSameDay(day, now);
            const dayLabel = format(day, 'd MMM');

            cumulativeTarget += dailyTargetVelocity;

            if (!isFuture) {
                const dayQuotes = currentPeriodQuotes.filter(q => isSameDay(new Date(q.paidAt), day)).reduce((sum, q) => sum + q.amount, 0);
                const dayInvoices = currentPeriodInvoices.filter(i => isSameDay(new Date(i.paidAt), day)).reduce((sum, i) => sum + i.amount, 0);
                cumulativeActual += (dayQuotes + dayInvoices);
                
                return { date: dayLabel, rawDate: day.toISOString(), actual: cumulativeActual, target: Math.round(cumulativeTarget), isFuture: false, isToday };
            } else {
                return { date: dayLabel, rawDate: day.toISOString(), actual: null, target: Math.round(cumulativeTarget), isFuture: true, isToday: false };
            }
        })
    };
}

// --- 2. COMPANY-SPECIFIC BOTTLENECK ANALYSIS ---
export function calculatePipelineHealth(currentLeads: any[], historicalLeads: any[]) {
    const stages = ['new-lead', 'quote-sent', 'job-booked', 'job-complete'];
    
    const getRates = (leads: any[]) => {
        const counts = stages.map(s => leads.filter(l => l.stage === s || l.status === s).length);
        // A lead in 'job-booked' also passed through 'new-lead' and 'quote-sent'
        const flow = [
            counts[0] + counts[1] + counts[2] + counts[3], // Total entered New
            counts[1] + counts[2] + counts[3],             // Total reached Quote
            counts[2] + counts[3],                         // Total reached Booked
            counts[3]                                      // Total reached Complete
        ];
        return {
            newToQuote: flow[0] > 0 ? flow[1] / flow[0] : 0,
            quoteToBooked: flow[1] > 0 ? flow[2] / flow[1] : 0,
            bookedToComplete: flow[2] > 0 ? flow[3] / flow[2] : 0,
            flow
        };
    };

    const histRates = getRates(historicalLeads);
    const currRates = getRates(currentLeads);

    // Compare current performance against their OWN historical baseline
    const drops =[
        { stage: 'Quotes Sent', drop: histRates.newToQuote - currRates.newToQuote, current: currRates.newToQuote },
        { stage: 'Jobs Booked', drop: histRates.quoteToBooked - currRates.quoteToBooked, current: currRates.quoteToBooked },
        { stage: 'Completed', drop: histRates.bookedToComplete - currRates.bookedToComplete, current: currRates.bookedToComplete }
    ];

    // Find the worst performing transition relative to baseline
    const worstDrop = drops.reduce((prev, current) => (prev.drop > current.drop) ? prev : current);

    let diagnosis = "Healthy Flow";
    let bottleneck = "None";
    let reasoning = "Pipeline conversion rates are matching or exceeding your historical averages.";
    let advice = "Maintain current operational velocity.";
    let severity: 'low' | 'medium' | 'high' = 'low';

    if (worstDrop.drop > 0.15) { // 15% worse than their usual
        severity = 'high';
        bottleneck = worstDrop.stage;
        if (worstDrop.stage === 'Quotes Sent') {
            diagnosis = "Lead Stagnation";
            reasoning = `Only ${(worstDrop.current * 100).toFixed(0)}% of new leads are receiving quotes, down from your historical average of ${(histRates.newToQuote * 100).toFixed(0)}%.`;
            advice = "Audit your new leads. Are they unqualified, or is the team taking too long to price jobs?";
        } else if (worstDrop.stage === 'Jobs Booked') {
            diagnosis = "Closing Failure";
            reasoning = `Quotes are converting to bookings at ${(worstDrop.current * 100).toFixed(0)}%, significantly below your ${(histRates.quoteToBooked * 100).toFixed(0)}% baseline.`;
            advice = "Implement an automated SMS follow-up sequence for all sent quotes after 48 hours.";
        } else {
            diagnosis = "Fulfillment Delay";
            reasoning = `Booked jobs are not reaching completion at your usual rate.`;
            advice = "Check calendar capacity and material supply chains. Jobs are getting stuck in the schedule.";
        }
    }

    return {
        stages:[
            { id: 'new-lead', label: 'New Leads', count: currRates.flow[0], value: 0, leads: currentLeads.filter(l => l.stage === 'new-lead'), color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
            { id: 'quote-sent', label: 'Quotes Sent', count: currRates.flow[1], value: 0, leads: currentLeads.filter(l => l.stage === 'quote-sent'), color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
            { id: 'job-booked', label: 'Jobs Booked', count: currRates.flow[2], value: 0, leads: currentLeads.filter(l => l.stage === 'job-booked'), color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { id: 'job-complete', label: 'Completed', count: currRates.flow[3], value: 0, leads: currentLeads.filter(l => l.stage === 'job-complete'), color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' }
        ],
        diagnosis, bottleneck, reasoning, advice, severity
    };
}

// --- 3. CASH FLOW CHRONOMETER (WITH AVG DAYS TO PAY) ---
export function generateCashFlowSeries(leads: any[], quotes: any[], invoices: any[], dateRange: DateRange) {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    // Calculate Average Days to Pay
    const paidItems = [...quotes, ...invoices].filter(x => x.status === 'paid' && x.paidAt && x.createdAt);
    const totalDaysToPay = paidItems.reduce((sum, item) => sum + differenceInDays(new Date(item.paidAt), new Date(item.createdAt)), 0);
    const avgDaysToPay = paidItems.length > 0 ? Math.round(totalDaysToPay / paidItems.length) : 0;

    let cumulativeRevenue = 0;
    let cumulativeCash = 0;

    const series = days.map(day => {
        const dayLabel = format(day, 'd MMM');
        const dayRevenue = leads.filter(l => isSameDay(new Date(l.createdAt), day)).reduce((sum, l) => sum + (l.value || 0), 0);
        const dayQuotes = quotes.filter(q => q.paidAt && isSameDay(new Date(q.paidAt), day)).reduce((sum, q) => sum + (q.amount || 0), 0);
        const dayInvoices = invoices.filter(i => i.paidAt && isSameDay(new Date(i.paidAt), day)).reduce((sum, i) => sum + (i.amount || 0), 0);

        cumulativeRevenue += dayRevenue;
        cumulativeCash += (dayQuotes + dayInvoices);

        return { date: dayLabel, rawDate: day.toISOString(), revenue: cumulativeRevenue, cash: cumulativeCash };
    });

    return { series, avgDaysToPay };
}