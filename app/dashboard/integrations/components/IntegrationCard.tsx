'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Copy, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'pending';
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
  copyValue?: string;
  color: string;
  variant?: 'default' | 'danger';
}

export function IntegrationCard({ 
    title, description, icon, status, meta, actionLabel, onAction, copyValue, color, variant = 'default' 
}: IntegrationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
      if (copyValue) {
          navigator.clipboard.writeText(copyValue);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  // Extract tailwind color class to hex for background opacity
  const bgClass = color.replace('bg-', 'bg-').replace('600', '500');

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] p-6 border border-gray-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col h-full relative overflow-hidden group"
    >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-5 gap-4">
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${color} text-white shadow-md shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-[15px] font-semibold text-[#1D1D1F] leading-tight">{title}</h3>
                    {meta && <p className="text-[11px] font-medium text-[#86868B] mt-1">{meta}</p>}
                </div>
            </div>

            {/* Status Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                status === 'connected' 
                    ? 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]' 
                    : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                    status === 'connected' ? 'bg-[#34C759]' : 'bg-gray-400'
                }`} />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                    {status === 'connected' ? 'Active' : 'Inactive'}
                </span>
            </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-[#424245] leading-relaxed mb-6 flex-1">
            {description}
        </p>

        {/* Action Area */}
        <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
            {copyValue ? (
                <div className="flex items-center gap-2 w-full bg-[#F5F5F7] p-2 rounded-xl border border-gray-200/50 group/copy">
                    <code className="text-[11px] text-[#1D1D1F] truncate flex-1 font-mono px-1">{copyValue}</code>
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 bg-white hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-[#007AFF] shadow-sm border border-gray-200/50 outline-none cursor-pointer"
                    >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            ) : (
                <button 
                    onClick={onAction}
                    className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors outline-none border-none bg-transparent cursor-pointer group/btn
                        ${variant === 'danger' 
                            ? 'text-[#FF3B30] hover:text-red-700' 
                            : 'text-[#007AFF] hover:text-blue-700'}`}
                >
                    {actionLabel || 'Configure'} 
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
            )}
        </div>
    </motion.div>
  );
}