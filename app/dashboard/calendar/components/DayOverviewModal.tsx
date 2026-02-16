'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ArrowRight, Calendar, Check, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Lead, STAGE_CONFIG } from '../../data';

interface DayOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: any[];
  onEventClick: (lead: Lead) => void;
}

export function DayOverviewModal({ isOpen, onClose, date, events, onEventClick }: DayOverviewModalProps) {
  if (!isOpen || !date) return null;

  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const dailyTotal = sortedEvents.reduce((sum, e) => sum + (e.resource.value || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* HEADER */}
            <div className="p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-start shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
                        {format(date, 'EEEE')}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-500">
                            {format(date, 'MMMM do')}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                            {events.length} Jobs
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            £{dailyTotal.toLocaleString()}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* LIST CONTAINER */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F9FAFB] min-h-0 p-4 space-y-3">
                {sortedEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <Calendar className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-medium">No jobs scheduled</span>
                    </div>
                ) : (
                    sortedEvents.map((event, idx) => {
                        const lead = event.resource as Lead;
                        const config = STAGE_CONFIG[lead.status] || STAGE_CONFIG['new-lead'];
                        
                        return (
                            <div 
                                key={idx}
                                onClick={() => onEventClick(lead)}
                                className="group flex items-stretch gap-4 p-4 rounded-[20px] border border-gray-200/60 bg-white hover:border-gray-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden shrink-0"
                            >
                                {/* TIME COLUMN */}
                                <div className="flex flex-col items-end justify-center w-10 shrink-0 gap-0.5 self-center">
                                    <span className="text-xs font-bold text-[#1D1D1F] leading-none">
                                        {format(event.start, 'HH:mm')}
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400 leading-none">
                                        {format(event.end, 'HH:mm')}
                                    </span>
                                </div>

                                {/* SPINE */}
                                <div 
                                    className="w-[4px] rounded-full shrink-0 self-stretch" 
                                    style={{ backgroundColor: config.iconColor }}
                                />

                                {/* DETAILS */}
                                <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-bold text-[#1D1D1F] truncate pr-2 leading-tight">
                                            {lead.firstName} {lead.lastName}
                                        </h4>
                                        <span className="text-[11px] font-bold text-[#1D1D1F] tabular-nums">
                                            £{lead.value.toLocaleString()}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium leading-none mt-0.5">
                                        <span className="truncate max-w-[140px]">
                                            {lead.service || 'Job'}
                                        </span>
                                        {lead.postcode && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="flex items-center gap-0.5 text-gray-400 shrink-0">
                                                    <MapPin className="w-3 h-3" /> {lead.postcode.split(' ')[0]}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* HOVER ARROW */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}