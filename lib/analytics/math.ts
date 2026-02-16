import { eachDayOfInterval, endOfMonth, format, getDate, isAfter, isSameDay, startOfMonth, differenceInDays, startOfDay, endOfDay, subDays, addDays } from "date-fns";

// --- TYPES ---
export interface DateRange {
    from: Date;
    to: Date;
}

export interface FinancialSnapshot {
    revenue: number;
    cost: number;
    grossProfit: number;
    margin: number;
    conversionRate: number;
    avgJobValue: number;
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    completedJobs: number;
}

// --- HELPER: PAYMENT STATUS ---
const isConverted = (l: any) => {
    const dep = (l.depositStatus || '').toLowerCase();
    const inv = (l.invoiceStatus || '').toLowerCase();
    return dep === 'paid' || inv === 'paid';
};

// --- 1. TIME TRAVELER LOGIC ---
export function getPreviousPeriod(current: DateRange): DateRange {
    const days = differenceInDays(current.to, current.from);
    const safeDays = Math.max(days, 1);
    const prevTo = subDays(current.from, 1);
    const prevFrom = subDays(prevTo, safeDays); // Keep duration same
    
    return { from: startOfDay(prevFrom), to: endOfDay(prevTo) };
}

// --- 2. FINANCIAL CALCULATOR (UPDATED) ---
export function calculateFinancials(
    leads: any[], 
    expenses: any[], 
    paidQuotes: any[], 
    paidInvoices: any[]
): FinancialSnapshot {
    const totalLeads = leads.length;
    
    // Won = Explicitly marked as won/complete OR has paid
    const wonLeadsList = leads.filter(l => isConverted(l) || l.status === 'job-complete' || l.status === 'previous-jobs');
    const wonCount = wonLeadsList.length;
    
    const lostCount = leads.filter(l => l.status === 'lost').length;
    const completedCount = leads.filter(l => l.status === 'job-complete' || l.status === 'previous-jobs').length;

    // REVENUE TRUTH: Sum of actual transactions in this period
    const quoteRevenue = paidQuotes.reduce((sum, q) => sum + (q.amount || 0), 0);
    const invoiceRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const revenue = quoteRevenue + invoiceRevenue;

    // COST TRUTH: Sum of expenses in this period
    const cost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const grossProfit = revenue - cost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // New Stats
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;
    // Avg Job Value based on Revenue / Won Count (Real Average)
    const avgJobValue = wonCount > 0 ? revenue / wonCount : 0;

    return { 
        revenue, 
        cost, 
        grossProfit, 
        margin,
        conversionRate,
        avgJobValue,
        totalLeads,
        wonLeads: wonCount,
        lostLeads: lostCount,
        completedJobs: completedCount
    };
}

// --- 3. WIN RATE ENGINE ---
export function calculateWinRate(allLeads: any[]): number {
    const closedLeads = allLeads.filter(l => 
        l.status === 'job-complete' || 
        l.status === 'previous-jobs' || 
        l.status === 'lost' ||
        isConverted(l)
    );

    if (closedLeads.length === 0) return 0.3; 

    const won = closedLeads.filter(l => isConverted(l) || l.status !== 'lost').length;
    return won / closedLeads.length;
}

// --- 4. DUAL-CONE FORECASTING ---
export function generateDualForecast(
    periodLeads: any[], 
    allOpenLeads: any[], 
    dateRange: DateRange, 
    winRate: number,
    periodQuotes: any[],   // NEW
    periodInvoices: any[]  // NEW
) {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const now = new Date();
    
    const openValue = allOpenLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    
    let cumulativeActual = 0;
    
    const expectedFutureRevenue = openValue * winRate;
    const optimisticUpside = openValue * (1 - winRate) * 0.5;
    const optimisticFutureRevenue = expectedFutureRevenue + optimisticUpside;

    return days.map(day => {
        const isFuture = isAfter(day, now);
        const isToday = isSameDay(day, now);
        const dayLabel = format(day, 'd MMM');

        // ACTUAL REVENUE: Sum of transactions for this day
        const dayQuotes = periodQuotes.filter(q => isSameDay(new Date(q.paidAt), day)).reduce((sum, q) => sum + q.amount, 0);
        const dayInvoices = periodInvoices.filter(i => isSameDay(new Date(i.paidAt), day)).reduce((sum, i) => sum + i.amount, 0);
        const dayRevenue = dayQuotes + dayInvoices;

        if (!isFuture) {
            cumulativeActual += dayRevenue;
            
            if (isToday) {
                return {
                    date: dayLabel,
                    rawDate: day.toISOString(),
                    actual: cumulativeActual,
                    target: cumulativeActual,
                    optimistic: cumulativeActual,
                    isFuture: false
                };
            }

            return {
                date: dayLabel,
                rawDate: day.toISOString(),
                actual: cumulativeActual,
                target: null,
                optimistic: null,
                isFuture: false
            };
        } else {
            const totalFutureDays = differenceInDays(dateRange.to, now);
            const daysElapsedInFuture = differenceInDays(day, now);
            
            const progress = totalFutureDays > 0 ? daysElapsedInFuture / totalFutureDays : 1;
            
            const targetVal = cumulativeActual + (expectedFutureRevenue * progress);
            const optimisticVal = cumulativeActual + (optimisticFutureRevenue * progress);

            return {
                date: dayLabel,
                rawDate: day.toISOString(),
                actual: null,
                target: Math.round(targetVal),
                optimistic: Math.round(optimisticVal),
                isFuture: true
            };
        }
    });
}

// --- 5. CASH FLOW CHRONOMETER ENGINE ---
export function generateCashFlowSeries(
    leads: any[], 
    quotes: any[], 
    invoices: any[], 
    dateRange: DateRange
) {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    let cumulativeRevenue = 0;
    let cumulativeCash = 0;

    return days.map(day => {
        const dayLabel = format(day, 'd MMM');
        
        // 1. REVENUE (Work Booked/Done)
        // We attribute revenue to the day the job was CREATED or BOOKED (using createdAt for simplicity/consistency)
        const dayRevenue = leads
            .filter(l => isSameDay(new Date(l.createdAt), day))
            .reduce((sum, l) => sum + (l.value || 0), 0);

        // 2. CASH (Money in Bank)
        // Sum of Quotes (Deposits) and Invoices paid on this day
        const dayQuotes = quotes
            .filter(q => q.paidAt && isSameDay(new Date(q.paidAt), day))
            .reduce((sum, q) => sum + (q.amount || 0), 0);
            
        const dayInvoices = invoices
            .filter(i => i.paidAt && isSameDay(new Date(i.paidAt), day))
            .reduce((sum, i) => sum + (i.amount || 0), 0);

        const dayCash = dayQuotes + dayInvoices;

        cumulativeRevenue += dayRevenue;
        cumulativeCash += dayCash;

        return {
            date: dayLabel,
            rawDate: day.toISOString(),
            revenue: cumulativeRevenue,
            cash: cumulativeCash,
            gap: cumulativeRevenue - cumulativeCash // The "Debt Gap"
        };
    });
}