import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-full flex flex-col pt-10 px-8 animate-pulse">
      
      {/* HEADER SKELETON */}
      <div className="flex justify-between items-end mb-8 gap-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-3"></div>
          <div className="h-4 w-64 bg-gray-100 rounded-md"></div>
        </div>
        <div className="flex gap-3">
            <div className="h-10 w-64 bg-gray-100 rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* KANBAN SKELETON */}
      <div className="flex gap-6 h-full overflow-hidden pb-8">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[320px] h-full flex flex-col shrink-0">
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
                    <div className="h-5 w-8 bg-gray-100 rounded-full"></div>
                </div>
                
                {/* Cards */}
                <div className="flex-1 bg-gray-50/50 rounded-2xl p-2 space-y-3 border border-dashed border-gray-200">
                    <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
                    <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm"></div>
                    <div className="h-24 bg-white rounded-xl border border-gray-100 shadow-sm opacity-50"></div>
                </div>
            </div>
        ))}
      </div>
      
      {/* CENTER LOADER OVERLAY */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-full shadow-xl border border-gray-100">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
      </div>
    </div>
  );
}