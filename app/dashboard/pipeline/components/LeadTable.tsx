'use client';

import { 
  Phone, Mail, MessageCircle, ShieldCheck, Award, Facebook, Megaphone, 
  User, PhoneIncoming, Star, Calendar, Clock, Check, PieChart, Receipt, CheckCircle2, ArrowRight, MessageSquare, MapPin
} from 'lucide-react';
import { Lead, LeadSource, LeadStatus, STAGE_CONFIG } from '../../data';
import { MoveToDropdown } from './MoveToDropdown';

// --- HELPER: Source Icons ---
const getSourceIcon = (source: LeadSource = 'Manual') => {
    const classes = "w-3.5 h-3.5";
    switch (source) {
        case 'Whatsapp': return <MessageCircle className={`${classes} text-[#25D366]`} />;
        case 'Checkatrade': return <ShieldCheck className={`${classes} text-slate-600`} />;
        case 'TrustATrader': return <Award className={`${classes} text-orange-500`} />;
        case 'SMS': return <MessageSquare className={`${classes} text-blue-500`} />;
        case 'Email': return <Mail className={`${classes} text-indigo-500`} />;
        case 'Meta': return <Facebook className={`${classes} text-[#1877F2]`} />;
        case 'Google Ads': return <Megaphone className={`${classes} text-blue-600`} />;
        case 'Missed Call': return <Phone className={`${classes} text-red-500`} />;
        case 'Phone Call': return <PhoneIncoming className={`${classes} text-cyan-600`} />;
        default: return <User className={`${classes} text-gray-400`} />;
    }
};

// --- HELPER: Job Time Status ---
const getJobSubtext = (lead: Lead) => {
    if (['job-booked', 'job-complete', 'previous-jobs'].includes(lead.status) && lead.jobDate) {
        const start = new Date(lead.jobDate);
        const end = lead.jobEndDate ? new Date(lead.jobEndDate) : null;
        
        const startDateStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        let displayText;

        if (end) {
            const isSameDay = start.toDateString() === end.toDateString();
            const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            if (isSameDay) {
                displayText = (
                    <span className="flex items-center gap-1">
                        {startDateStr} <span className="text-gray-300">|</span> {startTime} 
                        <ArrowRight className="w-2 h-2 text-gray-300" /> {endTime}
                    </span>
                );
            } else {
                const endDateStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                displayText = (
                    <span className="flex items-center gap-1">
                        {startDateStr}, {startTime} 
                        <ArrowRight className="w-2 h-2 text-gray-400" /> 
                        {endDateStr}, {endTime}
                    </span>
                );
            }
        } else {
            displayText = (
                <span className="flex items-center gap-1">
                    {startDateStr} <span className="text-gray-300">|</span> {startTime}
                </span>
            );
        }

        return {
            icon: <Calendar className="w-3 h-3" />,
            text: displayText,
            color: 'text-gray-600'
        };
    }
    if (lead.status === 'quote-sent' && lead.quoteHistory && lead.quoteHistory.length > 0) {
        const lastQuote = lead.quoteHistory[lead.quoteHistory.length - 1];
        const date = new Date(lastQuote.date);
        return {
            icon: <Clock className="w-3 h-3" />,
            text: `Quoted ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            color: 'text-orange-600'
        };
    }
    return null;
};

interface LeadTableProps {
  leads: Lead[];
  stage: string;
  onRowClick: (lead: Lead) => void;
  onMove: (lead: Lead, newStatus: LeadStatus) => void;
}

export function LeadTable({ leads, stage, onRowClick, onMove }: LeadTableProps) {
  const showPayment = ['new-lead', 'quote-sent', 'job-booked', 'job-complete', 'previous-jobs'].includes(stage);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[1000px] md:min-w-0 relative">
            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <tr>
                <th className="w-1 p-0 bg-transparent"></th>
                <th className="py-4 pl-4 pr-5 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Customer</th>
                <th className="py-4 px-6 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Contact</th>
                <th className="py-4 px-6 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider w-[20%]">Job Details</th>
                {showPayment && <th className="py-4 px-6 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Payment Status</th>}
                <th className="hidden md:table-cell py-4 px-6 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Source</th>
                <th className="py-4 px-6 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Financials</th>
                <th className="py-4 px-6 text-left text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Testimonial</th>
                <th className="py-4 pl-4 pr-8 text-right text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Action</th>
            </tr>
            </thead>
            
            <tbody>
            {leads.map((lead) => {
                const jobInfo = getJobSubtext(lead);
                const config = STAGE_CONFIG[lead.status] || STAGE_CONFIG['new-lead'];

                // --- FINANCIAL CALCULATION ---
                const total = lead.value || 0;
                const paidQuotes = (lead.quoteHistory || []).filter(q => q.status === 'paid').reduce((sum, q) => sum + q.amount, 0);
                const paidInvoices = (lead.invoiceHistory || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
                const totalPaid = paidQuotes + paidInvoices;
                const rawRemaining = total - totalPaid;
                const remaining = Math.abs(rawRemaining);
                
                let balanceColor = 'text-[#1D1D1F]';
                let balanceLabel = 'Remaining';
                if (rawRemaining === 0 && total > 0) {
                    balanceColor = 'text-[#34C759]'; // System Green
                    balanceLabel = 'Settled';
                } else if (rawRemaining < 0) {
                    balanceColor = 'text-[#FF9500]'; // System Orange
                    balanceLabel = 'Overpaid';
                }
                
                return (
                <tr 
                    key={lead.id} 
                    onClick={() => onRowClick(lead)}
                    className="group border-b border-gray-100 hover:bg-[#F5F5F7]/50 transition-colors cursor-pointer last:border-none relative"
                >
                {/* SPINE (Color Coded) */}
                <td className="p-0 w-1 relative">
                    <div 
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full transition-all group-hover:w-[4px]" 
                        style={{ backgroundColor: config.iconColor }}
                    />
                </td>

                {/* 1. CUSTOMER */}
                <td className="py-4 pl-4 pr-5 align-middle">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200/60 shrink-0">
                            {lead.firstName?.[0] || '?'}{lead.lastName?.[0] || ''}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="text-[13px] font-semibold text-[#1D1D1F]">{lead.firstName} {lead.lastName}</div>
                                {lead.autoTexted && (
                                    <span title="Recaptured">
                                        <CheckCircle2 className="w-3 h-3 text-[#007AFF]" />
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#86868B] mt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {lead.postcode || 'No Location'}
                            </div>
                        </div>
                    </div>
                </td>

                {/* 2. CONTACT */}
                <td className="py-4 px-6 align-middle">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[12px] font-medium text-[#1D1D1F]">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {lead.phone}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#86868B]">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[140px]">{lead.email}</span>
                        </div>
                    </div>
                </td>

                {/* 3. JOB DETAILS */}
                <td className="py-4 px-6 align-middle">
                    <div className="flex flex-col items-start gap-1.5">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-[#1D1D1F] text-[11px] font-medium border border-gray-200/60">
                            {lead.service || 'General Enquiry'}
                        </div>
                        {jobInfo && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${jobInfo.color}`}>
                                {jobInfo.icon}
                                {jobInfo.text}
                            </div>
                        )}
                    </div>
                </td>

                {/* 4. PAYMENT STATUS */}
                {showPayment && (
                    <td className="py-4 px-6 align-middle">
                        <div className="flex flex-col gap-1.5 items-start">
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide
                                ${lead.depositStatus === 'paid' ? 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                <PieChart className="w-3 h-3" />
                                {lead.depositStatus === 'paid' ? 'Deposit Paid' : 'Deposit'}
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide
                                ${lead.invoiceStatus === 'paid' ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                <Receipt className="w-3 h-3" />
                                {lead.invoiceStatus === 'paid' ? 'Invoice Paid' : 'Invoice'}
                            </div>
                        </div>
                    </td>
                )}

                {/* 5. SOURCE */}
                <td className="hidden md:table-cell py-4 px-6 align-middle">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500">
                            {getSourceIcon(lead.source)}
                        </div>
                        <span className="text-[12px] font-medium text-[#1D1D1F]">{lead.source}</span>
                    </div>
                </td>

                {/* 6. FINANCIALS */}
                <td className="py-4 px-6 align-middle">
                    <div className="flex flex-col items-start gap-0.5">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">{balanceLabel}</span>
                        </div>
                        <div className={`text-[13px] font-bold tabular-nums tracking-tight ${balanceColor}`}>
                            £{remaining.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#86868B] font-medium mt-0.5">
                            Total: £{total.toLocaleString()}
                        </div>
                    </div>
                </td>

                {/* 7. TESTIMONIAL */}
                <td className="py-4 px-6 align-middle text-left">
                    <div className="flex justify-start">
                        {lead.reviewRating ? (
                            <div className="flex items-center gap-1.5 bg-[#FF9500]/10 border border-[#FF9500]/20 px-2.5 py-1 rounded-full">
                                <span className="text-[11px] font-bold text-[#FF9500] tabular-nums">{Number(lead.reviewRating).toFixed(1)}</span>
                                <Star className="w-3 h-3 text-[#FF9500] fill-current" />
                            </div>
                        ) : lead.reviewStatus === 'sent' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">
                                Request Sent
                            </span>
                        ) : lead.reviewStatus === 'scheduled' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20">
                                Scheduled
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-300 font-medium px-2">
                                -
                            </span>
                        )}
                    </div>
                </td>

                {/* 8. MOVE TO */}
                <td className="py-4 pl-4 pr-8 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                        <MoveToDropdown 
                            currentStatus={lead.status} 
                            onMove={(newStatus) => onMove(lead, newStatus)} 
                        />
                    </div>
                </td>
                </tr>
            )})}
            
            {leads.length === 0 && (
                <tr>
                    <td colSpan={showPayment ? 9 : 8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                <User className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-400">No leads found in this stage.</p>
                        </div>
                    </td>
                </tr>
            )}
            </tbody>
        </table>
      </div>
    </div>
  );
}