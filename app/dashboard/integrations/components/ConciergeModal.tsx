'use client';

import { motion } from 'framer-motion';
import { X, Headset, Calendar, ShieldCheck } from 'lucide-react';

interface ConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'Meta' | 'Google' | null;
}

export function ConciergeModal({ isOpen, onClose, platform }: ConciergeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
        >
            {/* HEADER */}
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#007AFF]">
                        <Headset className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Concierge Setup</h3>
                        <p className="text-xs text-gray-500">White-Glove Integration</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* BODY */}
            <div className="p-8 space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-xl flex gap-3 items-start border border-blue-100/50">
                    <ShieldCheck className="w-5 h-5 text-[#007AFF] shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900 leading-relaxed">
                        <strong>Security First:</strong> To ensure your {platform} data remains secure and perfectly synced with TradeFlow, our engineering team handles this connection for you.
                    </p>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    Book a quick 5-minute integration call. We will guide you through the secure handshake without you ever needing to touch the technical settings.
                </p>
            </div>

            {/* FOOTER */}
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-6 py-3 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors bg-transparent border-none outline-none cursor-pointer"
                >
                    Cancel
                </button>
                <a 
                    href="https://calendly.com/shakil-igbokwe03/15-minute-consultation"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="px-8 py-3 bg-[#007AFF] hover:bg-[#0055FF] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 border-none outline-none cursor-pointer no-underline"
                >
                    <Calendar className="w-4 h-4" />
                    Book Setup Call
                </a>
            </div>
        </motion.div>
    </div>
  );
}