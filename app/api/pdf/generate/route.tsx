import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import { TradeFlowPDF } from '@/lib/pdf-generator';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const body = await request.json();
    const { lead, type, amount, referenceId } = body; // referenceId is passed but we use lead.id in PDF

    // --- GENERATE VANITY URL ---
    // Note: This link won't work until the record is saved in DB (which happens on Send).
    // For "Download PDF" (Preview), we can point to a generic payment page or the dashboard.
    // Ideally, we should create a "Draft" record if we want a working link, 
    // but for a PDF preview, a link to the dashboard is a safe fallback if no ID exists yet.
    
    // However, since we are just downloading the PDF, the link inside it should ideally work.
    // If this is a "Preview" before sending, the link might be dead.
    // Let's construct a link that *would* be valid if they proceed.
    // Or, better: Point to the main payment portal.
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // We don't have the Invoice ID yet if we haven't saved it.
    // So we will use a placeholder or the Dashboard URL for the preview.
    const paymentUrl = `${baseUrl}/dashboard`; 

    // Generate PDF Stream
    const stream = await renderToStream(
      <TradeFlowPDF 
        lead={lead} 
        user={user} 
        type={type} 
        amount={amount} 
        paymentUrl={paymentUrl} // <--- PASS URL
      />
    );

    const chunks: Buffer[] = [];
    // @ts-ignore
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_${lead.lastName}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}