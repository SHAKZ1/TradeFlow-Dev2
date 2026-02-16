'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, CheckCircle2, X, Info, AlertCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  onClose: () => void;       // Action: Dismiss/Stay
  onConfirm?: () => void;    // Action: Primary (Save/Delete)
  onCancel?: () => void;     // Action: Secondary (Discard)
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

export function AlertModal({ 
    isOpen, type, title, message, onClose, onConfirm, onCancel, 
    confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonColor 
}: AlertModalProps) {
  if (!isOpen) return null;

  // --- VISUAL CONFIGURATION ---
  let icon = <AlertTriangle className="w-8 h-8" />;
  let iconBg = "bg-amber-50";
  let iconColor = "text-amber-600";
  let defaultButtonClass = "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20";

  if (type === 'danger') {
      icon = <Trash2 className="w-8 h-8" />;
      iconBg = "bg-red-50";
      iconColor = "text-red-600";
      defaultButtonClass = "bg-red-600 hover:bg-red-700 shadow-red-500/20";
  } else if (type === 'success') {
      icon = <CheckCircle2 className="w-8 h-8" />;
      iconBg = "bg-emerald-50";
      iconColor = "text-emerald-600";
      defaultButtonClass = "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20";
  } else if (type === 'info') {
      icon = <Info className="w-8 h-8" />;
      iconBg = "bg-blue-50";
      iconColor = "text-blue-600";
      defaultButtonClass = "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20";
  }

  // Allow override for specific cases (like Unsaved Changes using custom colors)
  const finalButtonClass = confirmButtonColor || defaultButtonClass;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl border border-white/60 overflow-hidden relative flex flex-col"
        >
            {/* CLOSE BUTTON */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors border-none outline-none cursor-pointer z-10"
            >
                <X className="w-5 h-5" />
            </button>

            {/* CONTENT */}
            <div className="p-8 pb-6 text-center flex flex-col items-center">
                {/* ICON CIRCLE */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white ${iconBg} ${iconColor}`}>
                    {icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight leading-tight">
                    {title}
                </h3>
                
                <p className="text-sm text-gray-500 leading-relaxed px-2 font-medium">
                    {message}
                </p>
            </div>

            {/* ACTIONS */}
            <div className="p-6 pt-2 flex flex-col gap-3">
                <button 
                    onClick={() => {
                        if (onConfirm) onConfirm();
                        else onClose();
                    }} 
                    className={`w-full h-12 rounded-2xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 border-none outline-none cursor-pointer ${finalButtonClass}`}
                >
                    {confirmText}
                </button>
                
                {/* SECONDARY BUTTON */}
                {(onConfirm || onCancel) && (
                    <button 
                        onClick={() => {
                            if (onCancel) onCancel();
                            else onClose();
                        }}
                        className="w-full h-12 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-50 transition-colors border-none outline-none cursor-pointer"
                    >
                        {cancelText}
                    </button>
                )}
            </div>
        </motion.div>
    </div>
  );
}