'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Mail, MessageSquare, Calendar, Clock, History, Star, Check, 
  CheckCircle2, Download, Loader2, Send, ArrowRight, StarHalf, Eye, FileText
} from 'lucide-react';
import { QuoteRecord, Lead } from './data';
import { PdfPreviewModal } from './components/PdfPreviewModal';

// --- STYLING ---
const overlayClass = "fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm";
const modalClass = "bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col";

// --- LOGO ASSETS ---
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.49 12.275C23.49 11.485 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.25 17.21 15.81 18.11V21.09H19.66C21.93 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
    <path d="M12 24C15.24 24 17.97 22.915 19.98 21.09L16.13 18.11C15.09 18.83 13.71 19.36 12 19.36C8.81 19.36 6.05 17.26 5.03 14.33H1.1V17.33C3.09 21.39 7.24 24 12 24Z" fill="#34A853"/>
    <path d="M5.03 14.33C4.75 13.46 4.6 12.51 4.6 11.5C4.6 10.49 4.75 9.54 5.03 8.67V5.67H1.1C0.37 7.38 0 9.37 0 11.5C0 13.63 0.37 15.62 1.1 17.33L5.03 14.33Z" fill="#FBBC05"/>
    <path d="M12 3.64C13.86 3.64 15.42 4.29 16.66 5.47L20.08 2.01C17.97 0.04 15.24 0 12 0C7.24 0 3.09 2.61 1.1 6.67L5.03 9.67C6.05 6.74 8.81 3.64 12 3.64Z" fill="#EA4335"/>
  </svg>
);

const TrustpilotLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0L15.5 8.5H24L17 13.5L19.5 22.5L12 17.5L4.5 22.5L7 13.5L0 8.5H8.5L12 0Z" fill="#00B67A"/>
  </svg>
);

const YellLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FFD200"/>
    <path d="M16.5 6H14.5L10.5 12L6.5 6H4.5L9.5 13.5V18H11.5V13.5L16.5 6Z" fill="black"/>
  </svg>
);

// --- HELPERS ---
const validateEmail = (email?: string) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone?: string) => {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+44|0)7\d{9}$/.test(clean);
};

// --- REVIEW HISTORY MODAL ---
export function ReviewHistoryModal({ isOpen, onClose, rating, source = 'Google', text }: { 
    isOpen: boolean, 
    onClose: () => void, 
    rating: number, 
    source?: string,
    text?: string
}) {
    if (!isOpen) return null;

    const displaySource = source.charAt(0).toUpperCase() + source.slice(1);
    const numRating = Number(rating) || 5;

    // Logo Logic
    let LogoComponent = GoogleLogo;
    if (source.toLowerCase().includes('yell')) LogoComponent = YellLogo;
    if (source.toLowerCase().includes('trustpilot')) LogoComponent = TrustpilotLogo;

    return (
        <div className={overlayClass}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className={modalClass}>
                <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Client Feedback</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Verified Reviews</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"><X className="w-4 h-4" /></button>
                </div>

                <div className="px-8 py-6 bg-gray-50/30 min-h-[200px]">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <LogoComponent />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{displaySource} Review</div>
                                    <div className="text-xs text-gray-400 font-medium">
                                        {new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const isFull = i + 1 <= numRating;
                                    const isHalf = i < numRating && i + 1 > numRating;
                                    return (
                                        <span key={i}>
                                            {isFull ? (
                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            ) : isHalf ? (
                                                <div className="relative w-4 h-4">
                                                    <Star className="w-4 h-4 text-gray-200 absolute top-0 left-0" />
                                                    <StarHalf className="w-4 h-4 text-yellow-400 fill-current absolute top-0 left-0" />
                                                </div>
                                            ) : (
                                                <Star className="w-4 h-4 text-gray-200" />
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100/50 italic">
                            "{text || "Customer provided a rating via automated request."}"
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- QUOTE MODAL (APPLE OS UPGRADE) ---
export function QuoteModal({ isOpen, onClose, onSent, email, phone, history, contactId, opportunityId, lead }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSent: (record: QuoteRecord, newValue: number) => void,
    email?: string, 
    phone?: string,
    history?: QuoteRecord[],
    contactId?: string,
    opportunityId?: string,
    lead?: Lead
}) {
  const [channel, setChannel] = useState<'sms' | 'email'>('email');
  const [value, setValue] = useState('');
  const [quoteType, setQuoteType] = useState<'Initial' | 'Revised' | 'Final'>('Initial');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // PDF Preview State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const safeHistory = history || [];

  useEffect(() => {
    if (isOpen) {
        setValue('');
        setSending(false);
        if (safeHistory.length === 0) setQuoteType('Initial');
        else if (safeHistory.some(h => h.type === 'Final')) setQuoteType('Final');
        else setQuoteType('Revised');
    }
  }, [isOpen]);

  const handleSend = async () => {
      if (!value || !contactId || !opportunityId) return;
      setSending(true);
      
      try {
          const numValue = parseFloat(value);
          
          await fetch('/api/leads/quote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contactId,
                  opportunityId,
                  amount: numValue,
                  channel,
                  type: quoteType,
                  phone,
                  email,
                  lead: lead 
              })
          });

          const newRecord: QuoteRecord = {
              id: Date.now().toString(),
              type: quoteType,
              amount: numValue,
              method: channel,
              target: channel === 'sms' ? (phone || '') : (email || ''),
              date: new Date().toISOString(),
              status: 'sent'
          };

          onSent(newRecord, numValue);
          onClose();

      } catch (err) {
          console.error("Quote Send Error:", err);
      } finally {
          setSending(false);
      }
  };

  const handleDownload = async () => {
      if (!value || !lead) return;
      setDownloading(true);
      try {
          const res = await fetch('/api/pdf/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  lead: lead,
                  type: 'QUOTE',
                  amount: parseFloat(value),
                  referenceId: `Q-${Date.now().toString().slice(-6)}`
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

  const isEmailValid = validateEmail(email);
  const isPhoneValid = validatePhone(phone);

  const handleChannelClick = (type: 'sms' | 'email') => {
    if (type === 'sms') {
        if (isPhoneValid) setChannel('sms');
    } else {
        if (isEmailValid) setChannel('email');
    }
  };

  return (
    <div className={overlayClass}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#F9FAFB] w-full max-w-lg rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col relative">
        
        {/* HEADER */}
        <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                <FileText className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Send Deposit Quote</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Create a deposit request</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-6">
            
            {/* TYPE SELECTOR (Segmented Control) */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider ml-1">Quote Type</label>
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    {(['Initial', 'Revised', 'Final'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setQuoteType(type)}
                            className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all border-none outline-none cursor-pointer flex items-center justify-center gap-1.5
                                ${quoteType === type 
                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* AMOUNT INPUT */}
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider ml-1">Deposit Amount</label>
                <div className="relative group">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold text-lg group-focus-within:text-blue-500 transition-colors">£</span>
                    <input 
                        type="number" 
                        value={value} 
                        onChange={(e) => setValue(e.target.value)} 
                        className="w-full h-14 pl-10 pr-4 bg-white rounded-2xl border border-gray-200 outline-none text-xl font-bold text-gray-900 placeholder-gray-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" 
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
                        onClick={() => handleChannelClick('email')} 
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border cursor-pointer outline-none
                            ${channel === 'email' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                    >
                        <Mail className="w-4 h-4" /> Email
                    </button>
                    <button 
                        onClick={() => handleChannelClick('sms')} 
                        className={`h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border cursor-pointer outline-none
                            ${channel === 'sms' 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
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
            disabled={!value || downloading}
            className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Preview PDF"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Preview
          </button>

          <button 
            onClick={handleSend} 
            disabled={!value || sending} 
            className="flex-1 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 border-none outline-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:shadow-none cursor-pointer transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {sending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Quote</>}
          </button>
        </div>
      </motion.div>

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        pdfUrl={pdfUrl} 
        filename={`Quote_${lead?.lastName || 'Client'}.pdf`}
      />
    </div>
  );
}

// --- BOOKING MODAL ---
export function BookingModal({ isOpen, onClose, onConfirm, initialStart, initialEnd }: any) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [duration, setDuration] = useState('');

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isOpen) {
        const s = toLocalInput(initialStart);
        const e = toLocalInput(initialEnd);
        setStart(s);
        setEnd(e);
        if (s && e) {
            const diff = (new Date(e).getTime() - new Date(s).getTime()) / 3600000;
            setDuration(diff.toFixed(1));
        } else {
            setDuration('');
        }
    }
  }, [isOpen, initialStart, initialEnd]);

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
        setStart(value);
        if (end && value) {
            const s = new Date(value).getTime();
            const e = new Date(end).getTime();
            if (e > s) setDuration(((e - s) / 3600000).toFixed(1));
        } else if (duration && value) {
            const s = new Date(value).getTime();
            const e = new Date(s + (parseFloat(duration) * 3600000));
            const offset = e.getTimezoneOffset() * 60000;
            setEnd(new Date(e.getTime() - offset).toISOString().slice(0, 16));
        }
    } else {
        setEnd(value);
        if (start && value) {
            const s = new Date(start).getTime();
            const e = new Date(value).getTime();
            if (e > s) setDuration(((e - s) / 3600000).toFixed(1));
        }
    }
  };

  const handleDurationChange = (val: string) => {
    setDuration(val);
    const hours = parseFloat(val);
    if (start && !isNaN(hours)) {
        const s = new Date(start).getTime();
        const e = new Date(s + (hours * 3600000));
        const offset = e.getTimezoneOffset() * 60000;
        setEnd(new Date(e.getTime() - offset).toISOString().slice(0, 16));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={overlayClass}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className={modalClass}>
        
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Confirm Booking</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Set the schedule for this job</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none focus:outline-none focus:ring-0 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="px-8 py-8 space-y-6">
          
          {/* START TIME */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wider ml-1">Start Time</label>
            <div className="relative bg-gray-50 rounded-xl border border-gray-200 group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all flex items-center px-4 py-1">
                <Calendar className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input 
                    type="datetime-local" 
                    value={start} 
                    onChange={(e) => handleDateChange('start', e.target.value)} 
                    className="w-full p-3 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-gray-900 cursor-pointer" 
                />
            </div>
          </div>
          
          {/* END TIME */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wider ml-1">End Time</label>
            <div className="relative bg-gray-50 rounded-xl border border-gray-200 group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all flex items-center px-4 py-1">
                <Clock className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input 
                    type="datetime-local" 
                    value={end} 
                    onChange={(e) => handleDateChange('end', e.target.value)} 
                    className="w-full p-3 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-gray-900 cursor-pointer" 
                />
            </div>
          </div>

          {/* DURATION */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block tracking-wider ml-1">Duration</label>
            <div className="relative bg-gray-50 rounded-xl border border-gray-200 group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all flex items-center px-4 py-1">
                <Clock className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => handleDurationChange(e.target.value)} 
                    className="w-full p-3 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    placeholder="0" 
                />
                <span className="text-xs font-bold text-gray-400 pr-2">hrs</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={() => onConfirm({ start, end })} 
            disabled={!start || !end} 
            className="w-full py-3.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 border-none outline-none focus:outline-none focus:ring-0 disabled:opacity-50 disabled:shadow-none cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Confirm Booking
          </button>
        </div>
      </motion.div>
    </div>
  );
}