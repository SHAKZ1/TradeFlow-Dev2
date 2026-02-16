'use client';
 
import { useEffect } from 'react';
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
 
  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-md border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">System Critical Error</h2>
                <p className="text-gray-500 mb-8 text-sm">
                    The application encountered an unexpected state. Our engineers have been notified.
                </p>
                <button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                    Reboot System
                </button>
            </div>
        </div>
      </body>
    </html>
  );
}