'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mail, MessageSquare, Calendar, Clock, CreditCard, FileText, 
  MapPin, CheckCircle2, Hash, Receipt, ChevronRight, Check, History, 
  Star, ExternalLink, AlertCircle, Download, Loader2, Landmark, ShieldCheck, Eye, Phone, PieChart, ArrowRight
} from 'lucide-react';
import { Lead, InvoiceRecord } from './data';
import { PdfPreviewModal } from './components/PdfPreviewModal';

// --- LOGO ASSETS ---
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.49 12.275C23.49 11.485 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.25 17.21 15.81 18.11V21.09H19.66C21.93 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
    <path d="M12 24C15.24 24 17.97 22.915 19.98 21.09L16.13 18.11C15.09 18.83 13.71 19.36 12 19.36C8.81 19.36 6.05 17.26 5.03 14.33H1.1V17.33C3.09 21.39 7.24 24 12 24Z" fill="#34A853"/>
    <path d="M5.03 14.33C4.75 13.46 4.6 12.51 4.6 11.5C4.6 10.49 4.75 9.54 5.03 8.67V5.67H1.1C0.37 7.38 0 9.37 0 11.5C0 13.63 0.37 15.62 1.1 17.33L5.03 14.33Z" fill="#FBBC05"/>
    <path d="M12 3.64C13.86 3.64 15.42 4.29 16.66 5.47L20.08 2.01C17.97 0.04 15.24 0 12 0C7.24 0 3.09 2.61 1.1 6.67L5.03 9.67C6.05 6.74 8.81 3.64 12 3.64Z" fill="#EA4335"/>
  </svg>
);

const TrustpilotLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0L15.5 8.5H24L17 13.5L19.5 22.5L12 17.5L4.5 22.5L7 13.5L0 8.5H8.5L12 0Z" fill="#00B67A"/>
  </svg>
);

const YellLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FFD200"/>
    <path d="M16.5 6H14.5L10.5 12L6.5 6H4.5L9.5 13.5V18H11.5V13.5L16.5 6Z" fill="black"/>
  </svg>
);

// --- STYLING ---
const overlayClass = "fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm";
const modalClass = "bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative";

// --- SEND TEXT MODAL (APPLE OS UPGRADE) ---
export function SendTextModal({ isOpen, onClose, lead }: { isOpen: boolean, onClose: () => void, lead: Lead }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        await fetch('/api/leads/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactId: lead.contactId, channel: 'sms', phone: lead.phone, message })
        });
        setSending(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={overlayClass}>
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                className="bg-[#F9FAFB] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col relative"
            >
                {/* HEADER */}
                <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">New Message</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-gray-500 font-medium">To:</span>
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{lead.firstName}</span>
                                <span className="text-[10px] text-gray-400 font-mono ml-1">{lead.phone}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all overflow-hidden">
                        <textarea 
                            className="w-full h-48 p-5 bg-transparent border-none outline-none resize-none text-sm text-gray-900 leading-relaxed placeholder-gray-400 font-medium"
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            autoFocus
                        />
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SMS Preview</span>
                            <span className="text-[10px] font-bold text-gray-400">{message.length} chars</span>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors border-none outline-none cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend} 
                        disabled={!message || sending} 
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 border-none outline-none cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                        {sending ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send Text</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// --- SEND EMAIL MODAL (APPLE OS UPGRADE) ---
export function SendEmailModal({ isOpen, onClose, lead }: { isOpen: boolean, onClose: () => void, lead: Lead }) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        await fetch('/api/leads/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactId: lead.contactId, channel: 'email', email: lead.email, subject, message })
        });
        setSending(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={overlayClass}>
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                className="bg-[#F9FAFB] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col relative"
            >
                {/* HEADER */}
                <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">New Email</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-gray-500 font-medium">To:</span>
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{lead.firstName}</span>
                                <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{lead.email}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-4">
                    
                    {/* SUBJECT LINE */}
                    <div className="group">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Subject</label>
                        <input 
                            className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 outline-none text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all"
                            placeholder="Enter subject line..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* MESSAGE BODY */}
                    <div className="group">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Message</label>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:ring-4 focus-within:ring-indigo-50 focus-within:border-indigo-200 transition-all overflow-hidden">
                            <textarea 
                                className="w-full h-48 p-5 bg-transparent border-none outline-none resize-none text-sm text-gray-900 leading-relaxed placeholder-gray-400 font-medium"
                                placeholder="Write your email..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors border-none outline-none cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend} 
                        disabled={!message || !subject || sending} 
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 border-none outline-none cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                    >
                        {sending ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send Email</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// --- INVOICE MODAL (APPLE OS UPGRADE) ---
export function InvoiceModal({ isOpen, onClose, onSent, email, phone, history, contactId, opportunityId, name, value, lead }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSent: (record: InvoiceRecord) => void,
    email?: string,
    phone?: string,
    history?: InvoiceRecord[],
    contactId?: string,
    opportunityId?: string,
    name?: string,
    value?: number,
    lead?: Lead
}) {
    const [amount, setAmount] = useState(value?.toString() || '');
    const [channel, setChannel] = useState<'sms' | 'email'>('email');
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    // PDF Preview State
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (isOpen && value) {
            setAmount(value.toString());
        }
    }, [isOpen, value]);

    const handleSend = async () => {
        if (!amount || !contactId || !opportunityId) return;
        setSending(true);
        try {
            const numAmount = parseFloat(amount);

            await fetch('/api/leads/invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contactId, 
                    opportunityId, 
                    channel, 
                    amount: numAmount, 
                    phone, 
                    email, 
                    name,
                    lead 
                })
            });

            onSent({
                id: Date.now().toString(),
                amount: numAmount,
                method: channel,
                target: channel === 'sms' ? phone : email,
                status: 'sent',
                date: new Date().toISOString()
            });
            onClose();
        } catch (error) {
            console.error("Failed to send invoice", error);
        } finally {
            setSending(false);
        }
    };

    const handleDownload = async () => {
        if (!amount || !lead) return;
        setDownloading(true);
        try {
            const res = await fetch('/api/pdf/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead: lead,
                    type: 'INVOICE',
                    amount: parseFloat(amount),
                    referenceId: `INV-${Date.now().toString().slice(-6)}`
                })
            });
            
            if (!res.ok) throw new Error("PDF Failed");
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setIsPreviewOpen(true);

        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={overlayClass}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#F9FAFB] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col relative">
                
                {/* HEADER */}
                <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Send Invoice</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Request payment for {name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
                
                {/* BODY */}
                <div className="p-8 space-y-6">
                    
                    {/* AMOUNT INPUT */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider ml-1">Invoice Amount</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold text-lg group-focus-within:text-emerald-500 transition-colors">£</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full h-14 pl-10 pr-4 bg-white rounded-2xl border border-gray-200 outline-none text-xl font-bold text-gray-900 placeholder-gray-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" 
                                placeholder="0.00" 
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* CHANNEL SELECTOR */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider ml-1">Send Via</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setChannel('email')} 
                                className={`h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border cursor-pointer outline-none
                                    ${channel === 'email' 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                            >
                                <Mail className="w-4 h-4" /> Email
                            </button>
                            <button 
                                onClick={() => setChannel('sms')} 
                                className={`h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border cursor-pointer outline-none
                                    ${channel === 'sms' 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                            >
                                <MessageSquare className="w-4 h-4" /> SMS
                            </button>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 border-none outline-none focus:outline-none focus:ring-0 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">Cancel</button>
                  
                  <button 
                    onClick={handleDownload}
                    disabled={!amount || downloading}
                    className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                    title="Preview PDF"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Preview
                  </button>

                  <button 
                    onClick={handleSend} 
                    disabled={!amount || sending} 
                    className="flex-1 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 border-none outline-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:shadow-none cursor-pointer transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {sending ? 'Sending...' : <><Receipt className="w-4 h-4" /> Send Invoice</>}
                  </button>
                </div>
            </motion.div>

            {/* PDF PREVIEW MODAL */}
            <PdfPreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                pdfUrl={pdfUrl} 
                filename={`Invoice_${lead?.lastName || 'Client'}.pdf`}
            />
        </div>
    );
}

// --- MANUAL PAYMENT MODAL ---
export function ManualPaymentModal({ isOpen, onClose, onConfirm }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: (amount: number, type: 'deposit' | 'invoice') => void 
}) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'deposit' | 'invoice'>('deposit');
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        if (!amount) return;
        setSaving(true);
        setTimeout(() => {
            onConfirm(parseFloat(amount), type);
            setSaving(false);
            onClose();
            setAmount('');
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className={overlayClass}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className={modalClass}>
                <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Record Payment</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Log a cash or bank transfer manually</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="px-8 py-8 space-y-6">
                    {/* TYPE TOGGLE */}
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                        <button 
                            onClick={() => setType('deposit')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border-none outline-none cursor-pointer ${type === 'deposit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Deposit
                        </button>
                        <button 
                            onClick={() => setType('invoice')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all border-none outline-none cursor-pointer ${type === 'invoice' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Invoice
                        </button>
                    </div>

                    {/* AMOUNT INPUT */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider">Amount Received</label>
                        <div className="relative bg-white rounded-2xl border border-gray-200 group focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-50 transition-all">
                            <span className="absolute left-5 top-4 text-gray-400 font-bold text-lg">£</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                className="w-full pl-10 p-4 bg-transparent border-none outline-none text-2xl font-bold text-gray-900 placeholder-gray-200" 
                                placeholder="0.00" 
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 border-none outline-none focus:outline-none focus:ring-0 rounded-xl cursor-pointer">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!amount || saving} 
                        className="px-8 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-lg shadow-gray-200 transition-all flex items-center gap-2 border-none outline-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:shadow-none cursor-pointer transform hover:-translate-y-0.5"
                    >
                        {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Record Payment</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// --- JOB TICKET MODAL (APPLE OS UPGRADE) ---
export function JobTicketModal({ isOpen, onClose, lead, onOpenTestimonial }: { 
    isOpen: boolean, 
    onClose: () => void, 
    lead: Lead,
    onOpenTestimonial?: () => void
}) {
    if (!isOpen) return null;

    // --- EXISTING LOGIC (PRESERVED) ---
    const startDate = lead.jobDate ? new Date(lead.jobDate) : null;
    const endDate = lead.jobEndDate ? new Date(lead.jobEndDate) : null;
    
    let duration = "0h";
    if (startDate && endDate) {
        const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        duration = `${diff.toFixed(1)}h`;
    }

    const now = new Date();
    let timeStatus = { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Calendar className="w-3.5 h-3.5" /> };
    
    if (startDate && endDate) {
        if (now > endDate) {
            timeStatus = { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
        } else if (now >= startDate && now <= endDate) {
            timeStatus = { label: 'Live Now', color: 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse', icon: <AlertCircle className="w-3.5 h-3.5" /> };
        } else {
            const diffHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (diffHours < 24) {
                timeStatus = { label: `Starts in ${Math.ceil(diffHours)}h`, color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <Clock className="w-3.5 h-3.5" /> };
            } else {
                const days = Math.ceil(diffHours / 24);
                timeStatus = { label: `Starts in ${days}d`, color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Calendar className="w-3.5 h-3.5" /> };
            }
        }
    }

    const paidInvoices = (lead.invoiceHistory || []).filter(i => i.status === 'paid');
    const paidQuotes = (lead.quoteHistory || []).filter(q => q.status === 'paid');
    const allPayments = [...paidQuotes, ...paidInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalDepositPaid = paidQuotes.reduce((sum, q) => sum + q.amount, 0);
    const totalInvoicePaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className={overlayClass}>
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                className="bg-[#F9FAFB] w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* HEADER */}
                <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-start shrink-0 sticky top-0 z-20">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job Sheet</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${timeStatus.color}`}>
                                {timeStatus.icon} {timeStatus.label}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                            {lead.service || 'General Service'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-xs font-medium text-gray-500">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">#{lead.id.slice(0, 6).toUpperCase()}</span>
                            <span>•</span>
                            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4">
                        <button 
                            onClick={onClose} 
                            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-right">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Value</span>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">£{lead.value.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* 1. CLIENT & LOCATION (Bento Grid) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Client</span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                                    {lead.firstName[0]}{lead.lastName[0]}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 truncate">{lead.firstName} {lead.lastName}</h3>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                                        <Phone className="w-3 h-3" /> {lead.phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Location</span>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">{lead.postcode || 'No Postcode'}</h3>
                                    <p className="text-[11px] text-gray-500 mt-0.5">United Kingdom</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. SCHEDULE (Timeline) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timeline</span>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{duration} Duration</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Start */}
                            <div className="flex-1 bg-[#F9FAFB] rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Start</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {startDate ? startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {startDate ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </p>
                            </div>

                            <ArrowRight className="w-4 h-4 text-gray-300" />

                            {/* End */}
                            <div className="flex-1 bg-[#F9FAFB] rounded-xl p-3 border border-gray-100 text-right">
                                <div className="flex items-center gap-2 mb-1 justify-end">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">End</span>
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {endDate ? endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {endDate ? endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. FINANCIALS & TESTIMONIAL */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Financial Status */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-4">Payment Status</span>
                            <div className="space-y-3">
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${lead.depositStatus === 'paid' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <PieChart className={`w-4 h-4 ${lead.depositStatus === 'paid' ? 'text-blue-600' : 'text-gray-400'}`} />
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${lead.depositStatus === 'paid' ? 'text-blue-700' : 'text-gray-500'}`}>
                                                Deposit
                                            </span>
                                            {lead.depositStatus === 'paid' && (
                                                <span className="text-[10px] font-medium text-blue-600">£{totalDepositPaid.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    {lead.depositStatus === 'paid' ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <span className="text-[10px] font-bold text-gray-400">UNPAID</span>}
                                </div>
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${lead.invoiceStatus === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <Receipt className={`w-4 h-4 ${lead.invoiceStatus === 'paid' ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${lead.invoiceStatus === 'paid' ? 'text-emerald-700' : 'text-gray-500'}`}>
                                                Invoice
                                            </span>
                                            {lead.invoiceStatus === 'paid' && (
                                                <span className="text-[10px] font-medium text-emerald-600">£{totalInvoicePaid.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    {lead.invoiceStatus === 'paid' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-[10px] font-bold text-gray-400">UNPAID</span>}
                                </div>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-4">Testimonial</span>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    {lead.reviewRating ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                                <Star className="w-5 h-5 fill-current" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-bold text-gray-900 tracking-tight">{Number(lead.reviewRating).toFixed(1)}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Rating</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-60">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <Star className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-400">No Review Yet</span>
                                        </div>
                                    )}
                                </div>

                                {lead.reviewRating && (
                                    <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            {lead.reviewSource?.toLowerCase().includes('trustpilot') ? <TrustpilotLogo /> : 
                                             lead.reviewSource?.toLowerCase().includes('yell') ? <YellLogo /> : <GoogleLogo />}
                                            <span className="text-xs font-bold text-gray-700 capitalize">{lead.reviewSource || 'Google'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. PAYMENT HISTORY */}
                    {allPayments.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-4">Transaction History</span>
                            <div className="space-y-2">
                                {allPayments.map((p, i) => {
                                    const isManual = p.method === 'manual';
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-emerald-600 shadow-sm">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">
                                                        {'type' in p ? 'Deposit Payment' : 'Invoice Payment'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {new Date(p.date).toLocaleDateString('en-GB')} • {isManual ? 'Manual Entry' : 'via Stripe'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-900">£{p.amount.toLocaleString()}</span>
                                                {!isManual && (
                                                    <a 
                                                        href={`/pay/${'type' in p ? 'quote' : 'invoice'}/${p.id}`} 
                                                        target="_blank" 
                                                        className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="View Receipt"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 5. NOTES */}
                    {lead.notes && (
                        <div className="bg-yellow-50/50 p-6 rounded-2xl border border-yellow-100">
                            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider block mb-2">Field Notes</span>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                {lead.notes}
                            </p>
                        </div>
                    )}

                </div>
            </motion.div>
        </div>
    );
}