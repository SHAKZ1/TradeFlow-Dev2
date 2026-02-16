'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Calculator, TrendingUp, AlertCircle, Coins, Wallet, User, Phone, FileText, Send, ChevronDown, Check, Mail } from 'lucide-react';
import { CostRate } from '../settings/components/CostRateManager';
import { Lead } from '../data';
import { ElitePhoneInput } from '../PhoneInput';

interface JobExpense {
  id: string;
  label: string;
  amount: number;
  category: string;
  subcontractorName?: string;
  subcontractorPhone?: string;
  status?: string;
}

interface JobCostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  costRates: CostRate[];
}

// --- INLINE CUSTOM SELECT (MATCHING STANDARD) ---
function QuintillionSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], placeholder?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label;

    return (
        <div ref={containerRef} className="relative h-11">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 flex items-center justify-between cursor-pointer transition-all
                ${isOpen ? 'ring-2 ring-emerald-100 border-emerald-200' : ''}`}
            >
                <span className={`text-sm font-medium truncate ${selectedLabel ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedLabel || placeholder || 'Select...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-1 max-h-48 overflow-y-auto custom-scrollbar"
                    >
                        {options.map((opt) => (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`px-3 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-colors flex items-center justify-between
                                    ${value === opt.value ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function JobCostingModal({ isOpen, onClose, lead, costRates }: JobCostingModalProps) {
  const [expenses, setExpenses] = useState<JobExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mode, setMode] = useState<'smart' | 'custom' | 'subcontractor'>('smart');
  const [selectedRateId, setSelectedRateId] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [customLabel, setCustomLabel] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [subName, setSubName] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subEmail, setSubEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
        fetch(`/api/leads/expenses?opportunityId=${lead.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.expenses) setExpenses(data.expenses);
                setLoading(false);
            });
    }
  }, [isOpen, lead.id]);

  const revenue = lead.value || 0;
  const totalCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = revenue - totalCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const handleAdd = async () => {
      let label = '';
      let amount = 0;
      let category = 'other';
      let sName = undefined;
      let sPhone = undefined;
      let sEmail = undefined;

      if (mode === 'smart') {
          const rate = costRates.find(r => r.id === selectedRateId);
          if (!rate || !quantity) return;
          label = `${rate.label} (${quantity} ${rate.unit}s)`;
          amount = rate.cost * parseFloat(quantity);
          category = 'smart';
      } else if (mode === 'subcontractor') {
          if (!subName || !customAmount || (!subPhone && !subEmail)) {
              alert("Please provide a Name, Amount, and at least one contact method.");
              return;
          }
          label = `Subcontractor: ${subName}`;
          amount = parseFloat(customAmount);
          category = 'subcontractor';
          sName = subName;
          sPhone = subPhone;
          sEmail = subEmail;
      } else {
          if (!customLabel || !customAmount) return;
          label = customLabel;
          amount = parseFloat(customAmount);
          category = 'custom';
      }

      const tempId = Date.now().toString();
      const newExpense = { 
          id: tempId, label, amount, category, 
          subcontractorName: sName, subcontractorPhone: sPhone, status: 'draft' 
      };
      setExpenses(prev => [newExpense, ...prev]);

      setQuantity('');
      setCustomLabel('');
      setCustomAmount('');
      setSubName('');
      setSubPhone('');
      setSubEmail('');

      const res = await fetch('/api/leads/expenses', {
          method: 'POST',
          body: JSON.stringify({
              opportunityId: lead.id,
              label,
              amount,
              category,
              subcontractorName: sName,
              subcontractorPhone: sPhone,
              subcontractorEmail: sEmail
          })
      });
      
      const data = await res.json();
      if (data.expense) {
          setExpenses(prev => prev.map(e => e.id === tempId ? data.expense : e));
      }
  };

  const handleDelete = async (id: string) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      await fetch('/api/leads/expenses', {
          method: 'DELETE',
          body: JSON.stringify({ id })
      });
  };

  const handleGenerateContract = async (expenseId: string) => {
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'generating...' } : e));
      try {
          const res = await fetch('/api/subcontractor/generate', {
              method: 'POST',
              body: JSON.stringify({ expenseId, lead })
          });
          const data = await res.json();
          if (data.success) {
              setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'generated' } : e));
              window.open(data.url, '_blank');
          }
      } catch (e) {
          setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'failed' } : e));
      }
  };

  const handleSendAgreement = async (expenseId: string) => {
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'sending...' } : e));
      try {
          const res = await fetch('/api/subcontractor/send', {
              method: 'POST',
              body: JSON.stringify({ expenseId, lead })
          });
          const data = await res.json();
          if (data.success) {
              setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'sent' } : e));
          }
      } catch (e) {
          setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'failed' } : e));
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[650px]"
        >
            {/* HEADER */}
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <Calculator className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Job Costing</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Track expenses and manage subcontractors.</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                
                {/* LEFT: LEDGER (INPUT) */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-gray-50">
                    
                    {/* INPUT BOX */}
                    <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
                        
                        {/* MODE TOGGLE */}
                        <div className="flex gap-2 mb-4 bg-white p-1 rounded-xl border border-gray-100 w-fit">
                            <button onClick={() => setMode('smart')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border-none outline-none cursor-pointer ${mode === 'smart' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}>Smart Rate</button>
                            <button onClick={() => setMode('custom')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border-none outline-none cursor-pointer ${mode === 'custom' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-900'}`}>Custom</button>
                            <button onClick={() => setMode('subcontractor')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border-none outline-none cursor-pointer ${mode === 'subcontractor' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>Subcontractor</button>
                        </div>

                        {/* INPUT FIELDS */}
                        <div className="flex gap-3 items-end">
                            
                            {/* SMART RATE MODE */}
                            {mode === 'smart' && (
                                <>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Select Rate</label>
                                        <QuintillionSelect 
                                            value={selectedRateId}
                                            onChange={setSelectedRateId}
                                            options={costRates.map(r => ({ value: r.id, label: `${r.label} (£${r.cost}/${r.unit})` }))}
                                            placeholder="Choose item..."
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Qty</label>
                                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                                    </div>
                                </>
                            )}

                            {/* CUSTOM MODE */}
                            {mode === 'custom' && (
                                <>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Description</label>
                                        <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. Parking" className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                                    </div>
                                    <div className="w-28">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Cost (£)</label>
                                        <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="0.00" className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                                    </div>
                                </>
                            )}

                            {/* SUBCONTRACTOR MODE (STACKED LAYOUT) */}
                            {mode === 'subcontractor' && (
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Name</label>
                                            <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="e.g. John Smith" className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Rate (£)</label>
                                            <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="0.00" className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                                        </div>
                                    </div>
                                    
                                    {/* CHANGED: Flex-col to stack Phone and Email */}
                                    <div className="flex flex-col gap-3">
                                        <div className="w-full">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Phone</label>
                                            <div className="h-11">
                                                <ElitePhoneInput value={subPhone} onChange={(p) => setSubPhone(p)} />
                                            </div>
                                        </div>
                                        <div className="w-full">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1 mt-4">Email (Optional)</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                                <input value={subEmail} onChange={(e) => setSubEmail(e.target.value)} placeholder="john@example.com" className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-10 pr-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {mode !== 'subcontractor' && (
                                <button 
                                    onClick={handleAdd}
                                    className="h-11 w-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all border-none outline-none cursor-pointer"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* SUB ADD BUTTON (FULL WIDTH) */}
                        {mode === 'subcontractor' && (
                            <button 
                                onClick={handleAdd}
                                className="w-full py-3 mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all border-none outline-none cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Subcontractor
                            </button>
                        )}
                    </div>

                    {/* EXPENSE LIST */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Expense Ledger</h4>
                        {expenses.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-xs border-2 border-dashed border-gray-100 rounded-xl">
                                No expenses recorded.
                            </div>
                        ) : (
                            expenses.map((expense) => (
                                <div key={expense.id} className="bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all group overflow-hidden">
                                    <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${expense.category === 'subcontractor' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
                                                {expense.category === 'subcontractor' ? <User className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 block">{expense.label}</span>
                                                {expense.category === 'subcontractor' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 font-medium">Status: {expense.status || 'Draft'}</span>
                                                        {expense.subcontractorPhone && <span className="text-[10px] text-gray-300">• {expense.subcontractorPhone}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-900">£{expense.amount.toFixed(2)}</span>
                                            <button onClick={() => handleDelete(expense.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 border-none outline-none cursor-pointer">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {expense.category === 'subcontractor' && (
                                        <div className="bg-gray-50 px-3 py-2 flex gap-2 border-t border-gray-100">
                                            <button 
                                                onClick={() => handleGenerateContract(expense.id)}
                                                className="flex-1 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                <FileText className="w-3 h-3" /> 
                                                {expense.status === 'generating...' ? 'Generating...' : 'Generate Contract'}
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleSendAgreement(expense.id)}
                                                disabled={expense.status === 'draft' || expense.status === 'generating...'}
                                                className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
                                                    ${expense.status === 'sent' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                                        : expense.status === 'failed'
                                                            ? 'bg-red-50 text-red-600 border-red-200'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200'}`}
                                            >
                                                <Send className="w-3 h-3" /> 
                                                {expense.status === 'sent' ? 'Sent' : expense.status === 'sending...' ? 'Sending...' : expense.status === 'failed' ? 'Retry Send' : 'Send Agreement'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* RIGHT: PROFIT MONITOR (STATS) */}
                <div className="w-[320px] bg-gray-50 p-8 flex flex-col gap-6 shrink-0">
                    
                    {/* REVENUE CARD */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Coins className="w-4 h-4" /></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">£{revenue.toLocaleString()}</p>
                    </div>

                    {/* COST CARD */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-50 rounded-lg text-red-600"><Wallet className="w-4 h-4" /></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Costs</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">£{totalCost.toLocaleString()}</p>
                    </div>

                    {/* PROFIT CARD (HERO) */}
                    <div className={`p-6 rounded-3xl shadow-lg text-white relative overflow-hidden
                        ${margin < 20 ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-emerald-600 to-teal-600'}`}>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 opacity-90">
                                <TrendingUp className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Gross Profit</span>
                            </div>
                            {/* FIX: Changed text color to white for readability */}
                            <p className="text-4xl font-bold tracking-tight mb-1 text-white">£{grossProfit.toLocaleString()}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium opacity-90 text-white/90">{margin.toFixed(1)}% Margin</span>
                                {margin < 20 && <AlertCircle className="w-4 h-4 text-white animate-pulse" />}
                            </div>
                        </div>

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    </div>

                </div>
            </div>
        </motion.div>
    </div>
  );
}