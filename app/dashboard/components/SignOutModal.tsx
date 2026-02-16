'use client';

import { motion } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutModal({ isOpen, onClose, onConfirm }: SignOutModalProps) {
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
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                    <LogOut className="w-7 h-7 text-red-500 ml-1" />
                </div>
                
                {/* TEXT */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">End Session?</h3>
                <p className="text-sm text-gray-500 leading-relaxed px-4">
                    You are about to sign out of your secure workspace. Any unsaved changes will be preserved.
                </p>
            </div>

            {/* ACTIONS */}
            <div className="p-6 pt-0 flex flex-col gap-3">
                <button 
                    onClick={onConfirm}
                    className="w-full py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 border-none outline-none cursor-pointer"
                >
                    Sign Out
                </button>
                
                <button 
                    onClick={onClose}
                    className="w-full py-3 text-xs font-bold text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-50 rounded-xl transition-colors border-none outline-none cursor-pointer"
                >
                    Stay Logged In
                </button>
            </div>
        </motion.div>
    </div>
  );
}