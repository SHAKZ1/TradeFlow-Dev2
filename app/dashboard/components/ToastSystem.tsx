'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  },[]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  },[]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* TOAST CONTAINER (Top Center - Dynamic Island Style) */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[11000] flex flex-col gap-3 pointer-events-none w-full max-w-[380px] px-4">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timer);
  }, [duration, toast.id, onRemove]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#34C759]" />,
    error: <AlertCircle className="w-5 h-5 text-[#FF3B30]" />,
    info: <Info className="w-5 h-5 text-[#007AFF]" />
  };

  const gradients = {
    success: 'from-[#34C759] to-[#30D158]',
    error: 'from-[#FF3B30] to-[#FF453A]',
    info: 'from-[#007AFF] to-[#0A84FF]'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto relative overflow-hidden bg-white/80 backdrop-blur-2xl border border-black/[0.05] shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[20px] p-4 flex items-start gap-3"
    >
      {/* ICON */}
      <div className="shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-bold text-[#1D1D1F] tracking-tight leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-[12px] text-[#86868B] font-medium mt-1 leading-snug">
            {toast.message}
          </p>
        )}
      </div>

      {/* CLOSE BUTTON */}
      <button 
        onClick={() => onRemove(toast.id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100/50 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* THE SLIDING TIME BAR */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-[3px] bg-gradient-to-r ${gradients[toast.type]}`}
      />
    </motion.div>
  );
}