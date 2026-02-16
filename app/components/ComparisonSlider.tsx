'use client';

import { useState, useRef } from 'react';
import { GripVertical, PhoneMissed, AlertCircle, X, LayoutDashboard, Inbox, Calendar, PieChart, CheckCircle2, Clock, FileWarning, MessageCircle, FileText } from 'lucide-react';

export const ComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // --- VIEW 1: CHAOS (Deep Stress) ---
  const ChaosView = () => (
    <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center overflow-hidden select-none">
      {/* Gritty Texture */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/criss-cross.png')]" />
      
      {/* 1. The Angry Sticky Note */}
      <div className="absolute top-12 left-8 w-64 h-64 bg-[#FEF3C7] rotate-[-6deg] shadow-2xl p-6 flex flex-col gap-3 font-handwriting text-gray-900 transform hover:scale-105 transition-transform duration-500 z-10 border border-yellow-200/50">
        <span className="font-black text-2xl text-red-600 underline decoration-wavy decoration-2">URGENT!!</span>
        <p className="leading-snug text-lg font-bold">Call back John about the boiler quote?? He called 3 times!</p>
        <p className="text-sm mt-auto font-mono bg-white/50 p-2 rounded border border-yellow-300/50">07700 900...</p>
        {/* Coffee Stain Effect */}
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#78350F] opacity-10 rounded-full blur-xl" />
      </div>

      {/* 2. The Overdue Bill */}
      <div className="absolute bottom-16 right-24 w-56 h-64 bg-white rotate-[8deg] shadow-2xl p-6 flex flex-col gap-2 font-sans text-gray-800 transform hover:scale-105 transition-transform duration-500 z-0 border border-gray-300">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
            <span className="font-bold text-red-600 uppercase tracking-widest text-xs">Final Notice</span>
            <FileWarning className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-xs text-gray-500">Invoice #102</p>
        <p className="font-bold text-2xl">£1,250.00</p>
        <p className="text-xs text-red-500 font-bold mt-1">OVERDUE 14 DAYS</p>
        <div className="mt-auto w-full h-8 bg-red-50 rounded flex items-center justify-center text-red-600 text-xs font-bold">PAY NOW</div>
      </div>

      {/* 3. The Angry Text Message */}
      <div className="absolute top-1/3 right-10 w-64 bg-[#E5E7EB] rotate-[-3deg] shadow-xl p-4 rounded-2xl rounded-bl-none z-20 border border-gray-300">
        <p className="text-sm font-medium text-gray-900">"Where are you?? You said 9am!"</p>
        <div className="flex justify-end gap-1 mt-2">
            <span className="text-[10px] text-gray-500">10:42 AM</span>
        </div>
      </div>

      {/* 4. The Missed Calls Widget */}
      <div className="absolute bottom-1/3 left-16 w-64 h-32 bg-white/90 backdrop-blur-sm rotate-[4deg] shadow-2xl p-5 border border-gray-200 rounded-2xl flex flex-col justify-center items-center gap-2 z-30">
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg animate-bounce">12</div>
        <PhoneMissed className="w-8 h-8 text-red-500" />
        <span className="text-xl font-bold text-gray-900">Missed Calls</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Since 9:00 AM</span>
      </div>

      {/* Floating Debris */}
      <X className="absolute top-1/4 left-1/4 w-32 h-32 text-white/5 rotate-12" />
      <div className="absolute bottom-8 left-8 text-white/5 font-black text-9xl tracking-tighter">CHAOS</div>
    </div>
  );

  // --- VIEW 2: SYSTEM (Clean, TradeFlow) ---
  const SystemView = () => (
    <div className="absolute inset-0 bg-[#F9FAFB] flex flex-col overflow-hidden select-none font-sans">
      
      {/* HEADER */}
      <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0">
          <div>
              <h3 className="text-lg font-bold text-gray-900">Job Board</h3>
              <p className="text-xs text-gray-400 font-medium">Manage your pipeline</p>
          </div>
          <div className="flex gap-3">
              <div className="w-24 h-9 bg-gray-50 rounded-lg border border-gray-100" />
              <div className="w-9 h-9 bg-blue-600 rounded-lg shadow-md shadow-blue-500/20 flex items-center justify-center text-white">
                  <span className="text-sm font-bold">+</span>
              </div>
          </div>
      </div>

      {/* DASHBOARD BODY */}
      <div className="p-10 flex-1 overflow-hidden flex flex-col gap-8">
          
          {/* STATS ROW */}
          <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">£42,500</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Jobs</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">14</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Conversion Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">68%</p>
              </div>
          </div>

          {/* KANBAN BOARD (Mini) */}
          <div className="grid grid-cols-3 gap-6 h-full">
              
              {/* COL 1: NEW LEADS */}
              <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                      <span className="text-xs font-bold text-gray-900">New Leads</span>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
                  </div>
                  {/* Card 1 */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500 relative group hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">Sarah Jenkins</span>
                          <span className="text-xs font-bold text-gray-900">£2,500</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">Bathroom Renovation</p>
                      <div className="mt-3 flex gap-1">
                          <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 font-medium">Checkatrade</span>
                      </div>
                  </div>
                  {/* Card 2 */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500 relative group hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">Mike Ross</span>
                          <span className="text-xs font-bold text-gray-900">£850</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">Boiler Service</p>
                      <div className="mt-3 flex gap-1">
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">Recaptured</span>
                      </div>
                  </div>
              </div>

              {/* COL 2: QUOTE SENT */}
              <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-yellow-100">
                      <span className="text-xs font-bold text-gray-900">Quote Sent</span>
                      <span className="bg-yellow-50 text-yellow-600 text-[10px] font-bold px-2 py-0.5 rounded-full">2</span>
                  </div>
                  {/* Card 3 */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-yellow-400 relative group hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">David Kim</span>
                          <span className="text-xs font-bold text-gray-900">£1,200</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">Fuse Box Upgrade</p>
                      <div className="mt-3 flex gap-1 items-center">
                          <Clock className="w-3 h-3 text-orange-400" />
                          <span className="text-[9px] text-gray-500 font-medium">2h ago</span>
                      </div>
                  </div>
              </div>

              {/* COL 3: JOB BOOKED */}
              <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                      <span className="text-xs font-bold text-gray-900">Job Booked</span>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">4</span>
                  </div>
                  {/* Card 4 */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500 relative group hover:-translate-y-1 transition-transform duration-300">
                      <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">Alice W.</span>
                          <span className="text-xs font-bold text-gray-900">£4,500</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">Full Rewire • W4</p>
                      <div className="mt-3 flex gap-1">
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">Deposit Paid</span>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      <div className="absolute bottom-12 right-12 text-gray-900/5 font-black text-9xl tracking-tighter z-0">SYSTEM</div>
    </div>
  );

  return (
    <div 
        className="relative w-full h-[600px] rounded-[40px] overflow-hidden cursor-ew-resize shadow-2xl border border-gray-200 group select-none"
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
    >
        {/* LAYER 1: SYSTEM (Bottom Layer - Visible on Right) */}
        <SystemView />

        {/* LAYER 2: CHAOS (Top Layer - Visible on Left, Masked) */}
        <div 
            className="absolute inset-0 overflow-hidden border-r border-white/20 shadow-[10px_0_50px_rgba(0,0,0,0.2)]"
            style={{ width: `${sliderPosition}%` }}
        >
            <div className="absolute inset-0 w-full h-full">
                {/* Fix width to parent to prevent squishing */}
                <div className="w-[var(--container-width)] h-full" style={{ width: containerRef.current?.offsetWidth }}>
                    <ChaosView />
                </div>
            </div>
        </div>

        {/* SLIDER HANDLE (The "Liquid Glass" Pill) */}
        <div 
            className="absolute top-0 bottom-0 w-1.5 bg-white/50 backdrop-blur-sm cursor-ew-resize z-30"
            style={{ left: `${sliderPosition}%` }}
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center justify-center text-gray-400 border border-gray-100 transition-transform duration-200 group-hover:scale-110">
                <GripVertical className="w-6 h-6 text-gray-600" />
            </div>
        </div>

        {/* LABELS (Dynamic Opacity & Position Fix) */}
        <div 
            className="absolute top-10 left-10 px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-lg border border-white/10 transition-opacity duration-300 pointer-events-none z-40"
            style={{ opacity: sliderPosition > 10 ? 1 : 0 }}
        >
            The Chaos
        </div>
        
        <div 
            className="absolute top-10 right-10 px-5 py-2.5 bg-white/80 backdrop-blur-xl rounded-full text-xs font-bold text-gray-900 uppercase tracking-widest shadow-lg border border-white/50 transition-opacity duration-300 pointer-events-none z-40"
            style={{ opacity: sliderPosition < 90 ? 1 : 0 }}
        >
            The System
        </div>

    </div>
  );
};