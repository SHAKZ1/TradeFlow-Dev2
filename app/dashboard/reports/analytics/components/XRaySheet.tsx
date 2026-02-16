'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, ArrowRight, MessageSquare, Download } from 'lucide-react';
import { useState } from 'react';

interface XRayLead {
  id: string;
  name: string;
  value: number;
  status: string;
  date: string;
  source: string;
  contactId: string;
}

interface XRaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leads: XRayLead[];
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function XRaySheet({ isOpen, onClose, title, leads }: XRaySheetProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkMessage = () => {
      alert(`Sending message to ${selected.length} contacts... (Feature coming soon)`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
            {/* BACKDROP */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[10000]"
                onClick={onClose}
            />

            {/* SHEET */}
            <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-[32px] shadow-2xl z-[10001] flex flex-col overflow-hidden border-t border-gray-100"
            >
                {/* HEADER */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">X-Ray View</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">{leads.length} Records Found</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* ACTIONS */}
                {selected.length > 0 && (
                    <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700">{selected.length} Selected</span>
                        <div className="flex gap-2">
                            <button onClick={handleBulkMessage} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors">
                                <MessageSquare className="w-3 h-3" /> Bulk Message
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors">
                                <Download className="w-3 h-3" /> Export
                            </button>
                        </div>
                    </div>
                )}

                {/* LIST */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB]">
                    <div className="grid grid-cols-1 gap-3">
                        {leads.map((lead) => (
                            <div 
                                key={lead.id}
                                onClick={() => toggleSelect(lead.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group
                                    ${selected.includes(lead.id) ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                                        ${selected.includes(lead.id) ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {lead.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{lead.name}</h4>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">{lead.source}</span>
                                            <span>•</span>
                                            <span>{new Date(lead.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(lead.value)}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{lead.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}