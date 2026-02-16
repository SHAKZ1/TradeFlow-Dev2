'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Star, ArrowRight, X, Send, Check, Loader2, Wallet } from 'lucide-react';

interface ActionItem {
  id: string;
  contactId: string;
  name: string;
  value: number;
  date: string;
}

interface ActionListCardProps {
  type: 'invoice' | 'deposit' | 'review';
  items: ActionItem[];
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function ActionListCard({ type, items }: ActionListCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminding, setReminding] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  const totalValue = items.reduce((sum, i) => sum + i.value, 0);
  
  // --- CONFIGURATION ---
  let config = {
      title: 'Pending Reviews',
      subtext: 'Reputation Opportunity',
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      button: 'bg-amber-500 hover:bg-amber-600'
  };

  if (type === 'invoice') {
      config = {
          title: 'Outstanding Invoices',
          subtext: 'Cash Flow Alert',
          icon: AlertCircle,
          color: 'text-rose-600',
          bg: 'bg-rose-50',
          button: 'bg-rose-600 hover:bg-rose-700'
      };
  } else if (type === 'deposit') {
      config = {
          title: 'Outstanding Deposits',
          subtext: 'Secure the Job',
          icon: Wallet,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          button: 'bg-blue-600 hover:bg-blue-700'
      };
  }

  const handleRemind = async (item: ActionItem) => {
      setReminding(item.id);
      
      let message = `Hi ${item.name.split(' ')[0]}, hope you're well! Just a quick nudge about the review. It helps us a lot!`;
      if (type === 'invoice') message = `Hi ${item.name.split(' ')[0]}, just a friendly reminder regarding the outstanding invoice. Let us know if you need a copy.`;
      if (type === 'deposit') message = `Hi ${item.name.split(' ')[0]}, we are ready to book you in! Please settle the deposit to secure your slot.`;

      try {
          await fetch('/api/leads/message', {
              method: 'POST',
              body: JSON.stringify({
                  contactId: item.contactId,
                  channel: 'sms',
                  message: message
              })
          });
          setSent(prev => [...prev, item.id]);
      } catch (e) {
          console.error(e);
          alert("Failed to send reminder");
      } finally {
          setReminding(null);
      }
  };

  return (
    <>
      {/* CARD STATE (COMPACT WIDGET) */}
      <motion.div 
        layoutId={`card-${type}`}
        onClick={() => items.length > 0 && setIsOpen(true)}
        className={`bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group relative overflow-hidden
            ${items.length === 0 ? 'opacity-60 cursor-default' : ''}`}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{config.title}</span>
            {/* Perfect Circle Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                <config.icon className={`w-4 h-4 ${config.color}`} />
            </div>
        </div>
        
        {/* Data Row */}
        <div>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">
                    {items.length}
                </h3>
                <span className={`text-xs font-bold ${config.color} translate-y-[-2px]`}>
                    {type === 'review' ? 'Potential' : formatCurrency(totalValue)}
                </span>
            </div>
            <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                {type === 'review' ? 'Value' : 'Uncollected'}
            </p>
        </div>

        {/* Hover Action Hint */}
        {items.length > 0 && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                <div className={`p-1.5 rounded-full ${config.bg}`}>
                    <ArrowRight className={`w-4 h-4 ${config.color}`} />
                </div>
            </div>
        )}
      </motion.div>

      {/* MODAL STATE */}
      <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
                
                <motion.div 
                    layoutId={`card-${type}`}
                    className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
                >
                    {/* HEADER */}
                    <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bg}`}>
                                <config.icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{config.title}</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    {items.length} items • Total {formatCurrency(totalValue)}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* LIST */}
                    <div className="p-6 overflow-y-auto custom-scrollbar bg-[#F9FAFB] space-y-3">
                        {items.map((item) => {
                            const isSent = sent.includes(item.id);
                            const isReminding = reminding === item.id;

                            return (
                                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                            {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {formatCurrency(item.value)}
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={() => !isSent && handleRemind(item)}
                                        disabled={isSent || isReminding}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 transition-all border-none outline-none cursor-pointer
                                            ${isSent 
                                                ? 'bg-emerald-50 text-emerald-600 cursor-default' 
                                                : `${config.button} text-white shadow-lg shadow-gray-200`}`}
                                    >
                                        {isReminding ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                                         isSent ? <Check className="w-3 h-3" /> : 
                                         <Send className="w-3 h-3" />}
                                        {isReminding ? 'Sending...' : isSent ? 'Sent' : 'Remind'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </>
  );
}