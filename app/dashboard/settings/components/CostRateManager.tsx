'use client';

import { useState } from 'react';
import { Plus, Trash2, Coins, Hash, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CostRate {
  id: string;
  label: string;
  unit: string;
  cost: number;
}

interface CostRateManagerProps {
  rates: CostRate[];
  onChange: (rates: CostRate[]) => void;
}

export function CostRateManager({ rates, onChange }: CostRateManagerProps) {
  const [label, setLabel] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');

  const handleAdd = () => {
    if (!label || !unit || !cost) return;
    const newRate: CostRate = { id: `rate_${Date.now()}`, label, unit, cost: parseFloat(cost) };
    onChange([newRate, ...rates]);
    setLabel(''); setUnit(''); setCost('');
  };

  const handleDelete = (id: string) => {
      onChange(rates.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
        {/* INPUT ROW */}
        <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-5">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Item Label</label>
                <div className="relative group">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-[#34C759] transition-colors" />
                    <input 
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g. 7.5T Lorry"
                        className="w-full h-10 pl-10 pr-4 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#34C759]/20 transition-all"
                    />
                </div>
            </div>
            
            <div className="col-span-3">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Unit</label>
                <div className="relative group">
                    <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-[#34C759] transition-colors" />
                    <input 
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="e.g. Mile"
                        className="w-full h-10 pl-10 pr-4 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#34C759]/20 transition-all"
                    />
                </div>
            </div>

            <div className="col-span-3">
                <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Cost (£)</label>
                <div className="relative group">
                    <Coins className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-[#34C759] transition-colors" />
                    <input 
                        type="number"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 pl-10 pr-4 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#34C759]/20 transition-all"
                    />
                </div>
            </div>

            <div className="col-span-1">
                <button 
                    onClick={handleAdd}
                    disabled={!label || !unit || !cost}
                    className="w-full h-10 bg-[#34C759] hover:bg-[#2DA84E] text-white rounded-xl flex items-center justify-center shadow-md transition-all disabled:opacity-50 disabled:shadow-none border-none outline-none cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* LIST */}
        <div className="space-y-2">
            <AnimatePresence>
                {rates.map((rate) => (
                    <motion.div 
                        key={rate.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200/60 rounded-xl hover:border-gray-300 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center text-[#34C759] font-bold text-xs">
                                £
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-[#1D1D1F]">{rate.label}</p>
                                <p className="text-[11px] text-[#86868B] font-medium">
                                    £{rate.cost.toFixed(2)} per {rate.unit}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleDelete(rate.id)}
                            className="p-2 text-gray-300 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border-none outline-none cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {rates.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-xl bg-[#F5F5F7]/50">
                    No rates configured yet.
                </div>
            )}
        </div>
    </div>
  );
}