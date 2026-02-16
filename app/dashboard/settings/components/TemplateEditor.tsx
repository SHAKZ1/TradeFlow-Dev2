'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mail, FileText, Plus, Smartphone, Monitor, Check } from 'lucide-react';
import { CommunicationConfig, TemplateConfig } from '@/lib/default-templates';
import { parseTemplate } from '@/lib/template-parser';

interface TemplateEditorProps {
  config: CommunicationConfig;
  onChange: (config: CommunicationConfig) => void;
}

type Category = 'quote' | 'invoice' | 'booking' | 'review';
type Channel = 'sms' | 'email';

const VARIABLES = [
  { label: 'First Name', value: '{{firstName}}' },
  { label: 'Last Name', value: '{{lastName}}' },
  { label: 'Company Name', value: '{{myCompany}}' },
  { label: 'Service Type', value: '{{service}}' },
  { label: 'Amount', value: '{{amount}}' },
  { label: 'Date', value: '{{date}}' },
  { label: 'Smart Link', value: '{{link}}' },
];

const PREVIEW_DATA = {
  firstName: 'John',
  lastName: 'Smith',
  myCompany: 'TradeFlow Ltd',
  service: 'Boiler Repair',
  amount: '450',
  type: 'Initial',
  date: 'Friday 14th Oct, 10:00',
  link: 'tradeflow.uk/pay/...'
};

export function TemplateEditor({ config, onChange }: TemplateEditorProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('quote');
  const [activeChannel, setActiveChannel] = useState<Channel>('sms');
  
  const smsInputRef = useRef<HTMLTextAreaElement>(null);
  const emailBodyRef = useRef<HTMLTextAreaElement>(null);
  const emailSubjectRef = useRef<HTMLInputElement>(null);

  const currentTemplate = config[activeCategory];

  const updateTemplate = (updates: Partial<TemplateConfig>) => {
    onChange({
      ...config,
      [activeCategory]: { ...currentTemplate, ...updates }
    });
  };

  const insertVariable = (variable: string) => {
    let ref: HTMLTextAreaElement | HTMLInputElement | null = null;
    let field: keyof TemplateConfig = 'sms';

    if (activeChannel === 'sms') {
        ref = smsInputRef.current;
        field = 'sms';
    } else {
        ref = emailBodyRef.current;
        field = 'emailBody';
    }

    if (ref) {
        const start = ref.selectionStart;
        const end = ref.selectionEnd;
        const text = ref.value;
        const newText = text.substring(0, start) + variable + text.substring(end);
        updateTemplate({ [field]: newText });
        setTimeout(() => { ref!.focus(); ref!.setSelectionRange(start + variable.length, start + variable.length); }, 0);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 h-[600px]">
      
      {/* LEFT: EDITOR */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* CATEGORY TABS (Segmented Control) */}
        <div className="flex bg-[#F5F5F7] p-1 rounded-xl">
            {(['quote', 'invoice', 'booking', 'review'] as Category[]).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wide rounded-lg transition-all duration-200 outline-none border-none cursor-pointer
                        ${activeCategory === cat 
                            ? 'bg-white text-[#1D1D1F] shadow-sm' 
                            : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* CHANNEL TOGGLE & PDF SWITCH */}
        <div className="flex justify-between items-center">
            <div className="flex bg-[#F5F5F7] p-1 rounded-xl border border-gray-200/50">
                <button 
                    onClick={() => setActiveChannel('sms')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all border-none outline-none cursor-pointer
                        ${activeChannel === 'sms' 
                            ? 'bg-white text-[#007AFF] shadow-sm' 
                            : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                >
                    <MessageSquare className="w-3.5 h-3.5" /> SMS
                </button>
                <button 
                    onClick={() => setActiveChannel('email')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all border-none outline-none cursor-pointer
                        ${activeChannel === 'email' 
                            ? 'bg-white text-[#007AFF] shadow-sm' 
                            : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                >
                    <Mail className="w-3.5 h-3.5" /> Email
                </button>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide">Attach PDF</span>
                <button 
                    onClick={() => updateTemplate({ attachPdf: !currentTemplate.attachPdf })}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-300 focus:outline-none border-none cursor-pointer
                        ${currentTemplate.attachPdf ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300
                        ${currentTemplate.attachPdf ? 'translate-x-5' : 'translate-x-0'}`} 
                    />
                </button>
            </div>
        </div>

        {/* INPUT AREA */}
        <div className="flex-1 flex flex-col gap-4">
            {activeChannel === 'email' && (
                <div>
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block ml-1">Subject Line</label>
                    <input 
                        ref={emailSubjectRef}
                        value={currentTemplate.emailSubject}
                        onChange={(e) => updateTemplate({ emailSubject: e.target.value })}
                        className="w-full bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-200 focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl px-4 py-3 text-[13px] font-medium text-[#1D1D1F] outline-none transition-all placeholder-gray-400"
                        placeholder="Email Subject..."
                    />
                </div>
            )}

            <div className="flex-1 flex flex-col">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block ml-1">Message Body</label>
                <textarea 
                    ref={activeChannel === 'sms' ? smsInputRef : emailBodyRef}
                    value={activeChannel === 'sms' ? currentTemplate.sms : currentTemplate.emailBody}
                    onChange={(e) => updateTemplate({ [activeChannel === 'sms' ? 'sms' : 'emailBody']: e.target.value })}
                    className="flex-1 w-full bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-200 focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl p-4 text-[13px] font-medium text-[#1D1D1F] outline-none transition-all resize-none leading-relaxed placeholder-gray-400"
                    placeholder="Type your message here..."
                />
            </div>

            {/* VARIABLE PILLS */}
            <div>
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block ml-1">Insert Variable</label>
                <div className="flex flex-wrap gap-2">
                    {VARIABLES.map((v) => (
                        <button
                            key={v.value}
                            onClick={() => insertVariable(v.value)}
                            className="px-3 py-1.5 bg-white hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#007AFF] text-[10px] font-bold rounded-lg transition-all border border-gray-200 hover:border-[#007AFF]/30 flex items-center gap-1.5 outline-none cursor-pointer"
                        >
                            <Plus className="w-3 h-3" /> {v.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

      </div>

      {/* RIGHT: PREVIEW */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col">
        <div className="flex items-center gap-2 mb-4 px-1">
            {activeChannel === 'sms' ? <Smartphone className="w-4 h-4 text-gray-400" /> : <Monitor className="w-4 h-4 text-gray-400" />}
            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wide">Live Preview</span>
        </div>

        <div className="flex-1 bg-[#F2F2F7] rounded-[32px] border-[8px] border-[#1D1D1F] overflow-hidden relative shadow-2xl">
            <div className="h-6 bg-[#1D1D1F] w-full absolute top-0 left-0 z-10 flex justify-center items-center">
                <div className="w-16 h-4 bg-black rounded-b-xl" />
            </div>

            <div className="h-full w-full bg-white pt-10 px-4 pb-4 overflow-y-auto custom-scrollbar">
                {activeChannel === 'sms' ? (
                    <div className="flex flex-col gap-3">
                        <div className="self-start bg-[#E9E9EB] rounded-[18px] rounded-bl-none px-4 py-2 max-w-[85%]">
                            <p className="text-[13px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap">
                                {parseTemplate(currentTemplate.sms, PREVIEW_DATA)}
                            </p>
                        </div>
                        {currentTemplate.attachPdf && (
                            <div className="self-start bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-3 max-w-[85%] shadow-sm">
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-[#1D1D1F]">{activeCategory.toUpperCase()}.pdf</span>
                                    <span className="text-[9px] text-[#86868B]">145 KB</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="border-b border-gray-100 pb-2">
                            <p className="text-[10px] text-[#86868B] font-bold uppercase">Subject</p>
                            <p className="text-[13px] font-bold text-[#1D1D1F]">{parseTemplate(currentTemplate.emailSubject, PREVIEW_DATA)}</p>
                        </div>
                        <div className="text-[13px] text-[#1D1D1F] leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: parseTemplate(currentTemplate.emailBody, PREVIEW_DATA) }} />
                        
                        {currentTemplate.attachPdf && (
                            <div className="mt-4 border-t border-gray-100 pt-3">
                                <div className="bg-[#F5F5F7] border border-gray-200/50 rounded-xl p-2 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-[#1D1D1F]">{activeCategory.toUpperCase()}.pdf</span>
                                        <span className="text-[9px] text-[#86868B]">Attached</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

    </div>
  );
}