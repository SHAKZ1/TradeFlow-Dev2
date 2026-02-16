'use client';

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { ToolbarProps } from 'react-big-calendar';

interface ExtendedToolbarProps extends ToolbarProps {
    stats?: { count: number; value: number };
}

export function CustomToolbar(props: ExtendedToolbarProps) {
  const { label, onNavigate, onView, view, stats } = props;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
      
      {/* LEFT: Navigation & Title */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            <button 
                onClick={() => onNavigate('PREV')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all border-none outline-none cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
                onClick={() => onNavigate('TODAY')}
                className="px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-full transition-all border-none outline-none cursor-pointer"
            >
                Today
            </button>
            <button 
                onClick={() => onNavigate('NEXT')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all border-none outline-none cursor-pointer"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
        
        <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight min-w-[200px]">
            {label}
        </h2>
      </div>

      {/* CENTER: Executive Stats (Hidden on Mobile) */}
      {stats && (
          <div className="hidden xl:flex items-center gap-8 px-8 border-l border-r border-gray-200/60">
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Jobs</span>
                <span className="text-lg font-bold text-[#1D1D1F]">{stats.count}</span>
            </div>
            <div className="w-px h-8 bg-gray-200/60" />
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Value</span>
                <span className="text-lg font-bold text-emerald-600">£{stats.value.toLocaleString()}</span>
            </div>
          </div>
      )}
      
      {/* RIGHT: View Switcher (Segmented Control) */}
      <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/50">
        {(['year', 'month', 'week', 'day'] as const).map((v) => (
            <button
                key={v}
                onClick={() => onView(v as any)}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all border-none outline-none cursor-pointer capitalize
                    ${view === v 
                        ? 'bg-white text-[#1D1D1F] shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700 bg-transparent'
                    }`}
            >
                {v}
            </button>
        ))}
      </div>
    </div>
  );
}