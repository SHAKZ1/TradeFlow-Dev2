'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, CreditCard, ShieldCheck } from 'lucide-react';

interface StripeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function StripeModal({ isOpen, onClose, onSave }: StripeModalProps) {
  const [secretKey, setSecretKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
      setSaving(true);
      
      // LOGIC: Only send keys if they are not empty strings.
      // The API is already built to ignore undefined fields.
      const payload: any = {};
      if (secretKey.trim()) payload.stripeSecretKey = secretKey.trim();
      if (publishableKey.trim()) payload.stripePublishableKey = publishableKey.trim();

      await fetch('/api/settings', {
          method: 'POST',
          body: JSON.stringify(payload)
      });
      
      setSaving(false);
      setSecretKey(''); // Clear for security
      setPublishableKey('');
      onSave();
      onClose();
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
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Stripe Configuration</h3>
                        <p className="text-xs text-gray-500">Secure Payment Gateway</p>
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
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>Security Note:</strong> Leave fields blank to keep existing keys. Keys are encrypted at rest.
                    </p>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Publishable Key</label>
                    <input 
                        value={publishableKey}
                        onChange={(e) => setPublishableKey(e.target.value)}
                        placeholder="pk_..."
                        className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Secret Key</label>
                    <input 
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="sk_..."
                        className="w-full h-12 px-4 bg-gray-50 rounded-xl border-none outline-none text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 border-none outline-none cursor-pointer"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Keys
                </button>
            </div>
        </motion.div>
    </div>
  );
}