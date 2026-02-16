'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar } from 'lucide-react';

interface LeadItem {
  id: string;
  name: string;
  value: number;
  date: string;
  displayDate?: string; // <--- NEW
  dateLabel?: string;   // <--- NEW
}

interface StageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageName: string;
  leads: LeadItem[];
  color: string;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function StageDetailModal({ isOpen, onClose, stageName, leads, color }: StageDetailModalProps) {
  if (!isOpen) return null;

  const colorBase = color.replace('bg-', '').replace('-500', '');
  const borderClass = `border-${colorBase}-100`;
  const textClass = `text-${colorBase}-600`;
  const bgClass = `bg-${colorBase}-50`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={onClose}
        />
        
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
        >
            {/* HEADER */}
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">{stageName}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {leads.length} Leads • Total Value: {formatCurrency(leads.reduce((a, b) => a + b.value, 0))}
                    </p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* LIST */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-[#F9FAFB] space-y-3">
                {leads.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">No leads found for this period.</div>
                ) : (
                    leads.map((lead) => {
                        // Use displayDate if available, otherwise fallback to created date
                        const dateToShow = lead.displayDate || lead.date;
                        const label = lead.dateLabel || 'Date';

                        return (
                            <div key={lead.id} className={`bg-white border ${borderClass} rounded-xl p-4 flex items-center justify-between shadow-sm`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass} ${textClass}`}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{lead.name}</h4>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {/* QUINTILLION DOLLAR LABEL */}
                                            <span className="uppercase tracking-wide text-[9px] font-bold text-gray-300 mr-1">{label}:</span>
                                            {new Date(dateToShow).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(lead.value)}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </motion.div>
    </div>
  );
}