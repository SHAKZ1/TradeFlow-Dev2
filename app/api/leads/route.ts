import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. FETCH ALL DATA FROM LOCAL POSTGRES (Lightning Fast)
    const[leads, quotes, invoices, bookings] = await Promise.all([
        db.lead.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        db.quote.findMany({ where: { opportunityId: { not: '' } } }), 
        db.invoice.findMany({ where: { opportunityId: { not: '' } } }),
        db.booking.findMany({ where: { userId } })
    ]);

    // 2. MAP RELATIONS
    const mappedLeads = leads.map(lead => {
        const leadQuotes = quotes.filter(q => q.opportunityId === lead.id);
        const leadInvoices = invoices.filter(i => i.opportunityId === lead.id);
        const leadBookings = bookings.filter(b => b.opportunityId === lead.id);

        const quoteHistory = leadQuotes.map(q => ({
            id: q.id, type: q.type, amount: q.amount, method: q.method, status: q.status, date: q.createdAt.toISOString(), target: q.method === 'sms' ? lead.phone : lead.email
        }));

        const invoiceHistory = leadInvoices.map(i => ({
            id: i.id, amount: i.amount, method: i.method, status: i.status, date: i.createdAt.toISOString(), target: i.method === 'sms' ? lead.phone : lead.email
        }));

        const mappedBookings = leadBookings.map(b => ({
            id: b.id, startDate: b.startDate.toISOString(), endDate: b.endDate.toISOString(), title: b.title || 'Scheduled Job'
        }));

        return {
            ...lead,
            quoteHistory,
            invoiceHistory,
            bookings: mappedBookings,
            jobDate: lead.jobDate ? lead.jobDate.toISOString() : null,
            jobEndDate: lead.jobEndDate ? lead.jobEndDate.toISOString() : null,
            reviewScheduledDate: lead.reviewScheduledDate ? lead.reviewScheduledDate.toISOString() : null,
            createdAt: lead.createdAt.toISOString(),
            updatedAt: lead.updatedAt.toISOString(),
        };
    });

    return NextResponse.json({ leads: mappedLeads });

  } catch (error: any) {
    console.error("Database Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}