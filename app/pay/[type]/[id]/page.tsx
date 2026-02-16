import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function PaymentRedirectPage({ params }: PageProps) {
  const { type, id } = await params;

  let url: string | null = null;

  if (type === 'invoice') {
      const record = await db.invoice.findUnique({ where: { id } });
      // PRIORITIZE RECEIPT IF PAID
      url = record?.receiptUrl || record?.paymentUrl || null;
  } else if (type === 'quote') {
      const record = await db.quote.findUnique({ where: { id } });
      url = record?.receiptUrl || record?.paymentUrl || null;
  }

  if (url) {
      redirect(url);
  }

  return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Link Invalid</h1>
              <p className="text-gray-500 mt-2">This payment record could not be found.</p>
          </div>
      </div>
  );
}