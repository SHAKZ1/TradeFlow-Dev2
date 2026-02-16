import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export default async function ViewDocumentPage({ params }: PageProps) {
  const { type, id } = await params;

  let destinationUrl: string | null = null;

  try {
      if (type === 'quote') {
          const record = await db.quote.findUnique({ where: { id } });
          destinationUrl = record?.pdfUrl || null;
      } else if (type === 'invoice') {
          const record = await db.invoice.findUnique({ where: { id } });
          destinationUrl = record?.pdfUrl || null;
      }
  } catch (error) {
      console.error("Redirect Error:", error);
  }

  if (destinationUrl) {
      redirect(destinationUrl);
  }

  return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Document Not Found</h1>
          <p className="text-gray-500 mt-2">The document you are looking for is unavailable or has expired.</p>
      </div>
  );
}