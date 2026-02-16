'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Landmark, ShieldCheck } from 'lucide-react';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: { name: string; sortCode: string; accountNumber: string };
}

export function BankModal({ isOpen, onClose, onSave, initialData }: BankModalProps) {
  const [name, setName] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // --- DEBUG LOG ---
  useEffect(() => {
      if (isOpen) {
          console.log("🏦 BankModal Opened. Initial Data:", initialData);
      }
  }, [isOpen, initialData]);

  // --- SYNC STATE ---
  useEffect(() => {
      if (isOpen && initialData) {
          setName(initialData.name || '');
          setSortCode(initialData.sortCode || '');
          setAccountNumber(initialData.accountNumber || '');
      }
  }, [isOpen, initialData]);

  const handleSave = async () => {
      setSaving(true);
      console.log("💾 Saving Bank Details:", { name, sortCode, accountNumber });
      
      try {
          const res = await fetch('/api/settings', {
              method: 'POST',
              body: JSON.stringify({ 
                  bankAccountName: name, 
                  bankSortCode: sortCode,
                  bankAccountNumber: accountNumber
              })
          });
          
          if (!res.ok) {
              console.error("API Error:", await res.text());
          } else {
              console.log("✅ API Success");
          }

          await onSave(); 
          onClose();
      } catch (error) {
          console.error("Failed to save bank details", error);
      } finally {
          setSaving(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
        >
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Bank Transfer</h3>
                        <p className="text-xs text-gray-500">Direct Payment Details</p>
                    </div>
                </div>
                {/* FIX: TRILLION DOLLAR CLOSE BUTTON */}
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-8 space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">
                        These details will be appended to your Quotes and Invoices as an alternative payment method.
                    </p>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Account Name</label>
                    <input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. TradeFlow Ltd"
                        className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sort Code</label>
                        <input 
                            value={sortCode}
                            onChange={(e) => setSortCode(e.target.value)}
                            placeholder="00-00-00"
                            className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Account Number</label>
                        <input 
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="12345678"
                            className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 border-none outline-none cursor-pointer"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Details
                </button>
            </div>
        </motion.div>
    </div>
  );
}