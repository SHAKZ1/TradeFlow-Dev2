'use client';

import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';

interface BookingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  clientName: string;
}

export function BookingConfirmModal({ isOpen, onClose, onConfirm, onSkip, clientName }: BookingConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl border border-white/50 overflow-hidden"
        >
            <div className="p-8 text-center">
                {/* ICON */}
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-orange-100">
                    <Calendar className="w-7 h-7 text-orange-600" />
                </div>
                
                {/* TEXT */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Schedule Job</h3>
                <p className="text-sm text-gray-500 leading-relaxed px-2">
                    <span className="font-semibold text-gray-900">{clientName}</span> is ready to be booked. Would you like to set the date and duration now?
                </p>
            </div>

            {/* ACTIONS */}
            <div className="p-6 pt-0 flex flex-col gap-3">
                <button 
                    onClick={onConfirm}
                    className="w-full py-3.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 border-none outline-none cursor-pointer"
                >
                    Create Booking <ArrowRight className="w-4 h-4" />
                </button>
                
                <button 
                    onClick={onSkip}
                    className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 bg-transparent hover:bg-gray-50 rounded-xl transition-colors border-none outline-none cursor-pointer"
                >
                    Skip for Now
                </button>
            </div>
        </motion.div>
    </div>
  );
}