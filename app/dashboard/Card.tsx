'use client';

import { useDraggable } from '@dnd-kit/core';
import { 
  MapPin, MessageCircle, Mail, Phone, ShieldCheck, Award, 
  Facebook, Megaphone, User, PhoneIncoming, MessageSquare
} from 'lucide-react';
import { Lead, LeadSource } from './data';
import { motion } from 'framer-motion';

interface CardProps {
  lead: Lead;
  isOverlay?: boolean;
  onClick?: () => void;
}

// --- SOURCE ICONS ---
const getSourceIcon = (source: LeadSource = 'Manual') => {
    const c = "w-3 h-3";
    switch (source) {
        case 'Whatsapp': return <MessageCircle className={`${c} text-[#25D366]`} />;
        case 'Checkatrade': return <ShieldCheck className={`${c} text-slate-600`} />;
        case 'TrustATrader': return <Award className={`${c} text-orange-500`} />;
        case 'SMS': return <MessageSquare className={`${c} text-blue-500`} />;
        case 'Email': return <Mail className={`${c} text-indigo-500`} />;
        case 'Meta': return <Facebook className={`${c} text-[#1877F2]`} />;
        case 'Google Ads': return <Megaphone className={`${c} text-blue-600`} />;
        case 'Missed Call': return <Phone className={`${c} text-red-500`} />;
        case 'Phone Call': return <PhoneIncoming className={`${c} text-cyan-600`} />;
        default: return <User className={`${c} text-gray-400`} />;
    }
};

export function Card({ lead, isOverlay, onClick }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { ...lead },
    disabled: !!isOverlay,
  });

  // --- SMART BORDER LOGIC ---
  const getSmartBorderColor = () => {
      const now = new Date();
      if (lead.jobEndDate && now > new Date(lead.jobEndDate)) return '#34C759'; // Complete (Green)
      if (lead.jobDate) return '#AF52DE'; // Booked (Purple)
      const hasQuotes = lead.quoteHistory && lead.quoteHistory.length > 0;
      const hasInvoices = lead.invoiceHistory && lead.invoiceHistory.length > 0;
      if (hasQuotes || hasInvoices) return '#FF9500'; // Financials (Orange)
      return '#007AFF'; // New (Blue)
  };

  const smartBorderColor = getSmartBorderColor();
  
  // --- SMART DATE LOGIC ---
  const getSmartDate = () => {
      if (!lead.jobDate) return null;
      const start = new Date(lead.jobDate);
      const now = new Date();
      const isToday = start.toDateString() === now.toDateString();
      const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === start.toDateString();
      
      let label = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      let color = 'text-gray-500 bg-gray-100/80';

      if (isToday) { label = 'Today'; color = 'text-blue-600 bg-blue-50 font-bold'; }
      else if (isTomorrow) { label = 'Tomorrow'; color = 'text-indigo-600 bg-indigo-50'; }
      else if (start < new Date()) { color = 'text-red-600 bg-red-50'; }

      return { label, color };
  };
  const smartDate = getSmartDate();

  // --- STYLES ---
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const baseClasses = `
    relative group w-full
    bg-white rounded-[16px] 
    border border-gray-200/60
    shadow-[0_2px_8px_rgba(0,0,0,0.02)]
    hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-gray-300/80
    transition-shadow duration-200 ease-out
    cursor-grab active:cursor-grabbing
    touch-none select-none
    overflow-hidden
  `;

  const overlayClasses = "shadow-2xl ring-1 ring-black/5 rotate-2 scale-105 z-50 cursor-grabbing";
  const dragClasses = isDragging ? "opacity-0 pointer-events-none" : "";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`${baseClasses} ${isOverlay ? overlayClasses : dragClasses}`}
      layoutId={isOverlay ? undefined : lead.id} // Smooth layout transitions
      layout={!isOverlay} // Only animate layout changes when not dragging
    >
      {/* LEFT ACCENT BAR */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[4px]" 
        style={{ backgroundColor: smartBorderColor }} 
      />

      <div className="pl-4 pr-3 py-3 flex flex-col gap-2">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
            <div className="flex flex-col min-w-0 pr-2">
                <h4 className="text-[14px] font-semibold text-[#1D1D1F] leading-tight truncate tracking-tight">
                    {lead.firstName} {lead.lastName}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-[#86868B] font-medium truncate max-w-[120px]">
                        {lead.service || 'General Enquiry'}
                    </span>
                </div>
            </div>
            
            {/* VALUE */}
            <div className="flex flex-col items-end">
                <span className="text-[13px] font-bold text-[#1D1D1F] tabular-nums tracking-tight">
                    £{lead.value.toLocaleString()}
                </span>
            </div>
        </div>

        {/* METADATA */}
        <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 border border-gray-100" title={lead.source}>
                    {getSourceIcon(lead.source)}
                </div>
                {lead.postcode && (
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-100">
                        <MapPin className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[10px] font-semibold text-gray-500 uppercase">{lead.postcode.split(' ')[0]}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5">
                {smartDate && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${smartDate.color}`}>
                        {smartDate.label}
                    </span>
                )}
                <div className="flex gap-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${lead.depositStatus === 'paid' ? 'bg-blue-500' : 'bg-gray-200'}`} title="Deposit" />
                    <div className={`w-1.5 h-1.5 rounded-full ${lead.invoiceStatus === 'paid' ? 'bg-emerald-500' : 'bg-gray-200'}`} title="Invoice" />
                </div>
            </div>
        </div>

      </div>
    </motion.div>
  );
}