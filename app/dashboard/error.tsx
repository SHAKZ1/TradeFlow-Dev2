'use client'; // Error components must be Client Components
 
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
 
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard Crash:", error);
  }, [error]);
 
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-red-100">
            <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">System Interruption</h2>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
            The dashboard encountered an unexpected state while synchronizing with the CRM. 
            This is usually a temporary connection issue.
        </p>
        
        <div className="flex gap-4">
            <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
            >
                <Home className="w-4 h-4" /> Return Home
            </button>
            
            <button
                onClick={() => reset()}
                className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4" /> Reboot Dashboard
            </button>
        </div>
        
        {error.digest && (
            <p className="mt-8 text-[10px] font-mono text-gray-300 uppercase tracking-widest">
                Error Code: {error.digest}
            </p>
        )}
    </div>
  );
}