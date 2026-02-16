'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Hash, Calendar, Type, AlignLeft, Layers, ChevronDown } from 'lucide-react';
import { CustomField } from '../settings/components/DocumentBuilder';

interface JobSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CustomField[];
  initialValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
}

// --- INLINE CUSTOM SELECT (MATCHING STANDARD INPUT STYLE) ---
function QuintillionSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder?: string }) {
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

    return (
        <div ref={containerRef} className="relative h-[46px]">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                // MATCHING INPUT STYLING EXACTLY
                className={`w-full h-full bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all
                ${isOpen ? 'bg-white border-indigo-200 ring-2 ring-indigo-100' : ''}`}
            >
                <span className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {value || placeholder || 'Select...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
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
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`px-4 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-colors flex items-center justify-between
                                    ${value === opt ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                {opt}
                                {value === opt && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function JobSpecsModal({ isOpen, onClose, config, initialValues, onSave }: JobSpecsModalProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});

  useEffect(() => {
    if (isOpen) setValues(initialValues || {});
  }, [isOpen, initialValues]);

  const handleChange = (id: string, val: any) => {
    setValues(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]"
        >
            {/* HEADER */}
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Job Specifications</h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Enter the specific details for this job.</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* BODY */}
            <div className="p-8 overflow-y-auto custom-scrollbar bg-[#F9FAFB]">
                {config.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p>No fields configured.</p>
                        <p className="text-xs mt-2">Go to Settings {'>'} Job Specification Engine to add fields.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {config.map((field) => {
                            const val = values[field.id] || '';
                            
                            // --- DROPDOWN (FULL WIDTH, NO ICON) ---
                            if (field.type === 'dropdown') {
                                const options = field.options?.split(',').map(o => o.trim()) || [];
                                return (
                                    <div key={field.id}>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
                                            {field.label}
                                        </label>
                                        <QuintillionSelect 
                                            value={val}
                                            onChange={(v) => handleChange(field.id, v)}
                                            options={options}
                                            placeholder={field.placeholder}
                                        />
                                    </div>
                                );
                            }

                            // --- TEXT / NUMBER / DATE / TEXTAREA ---
                            return (
                                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">
                                        {field.label}
                                    </label>
                                    
                                    <div className="relative group">
                                        {/* ICON (Only for non-dropdowns) */}
                                        <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors z-10">
                                            {field.type === 'number' && <Hash className="w-4 h-4" />}
                                            {field.type === 'date' && <Calendar className="w-4 h-4" />}
                                            {field.type === 'text' && <Type className="w-4 h-4" />}
                                            {field.type === 'textarea' && <AlignLeft className="w-4 h-4" />}
                                        </div>

                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={val}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                placeholder={field.placeholder}
                                                rows={4}
                                                // FIX: Updated focus ring to ring-2 ring-indigo-100
                                                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition-all resize-none placeholder-gray-400"
                                            />
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'datetime-local' : 'text'}
                                                value={val}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                placeholder={field.placeholder}
                                                // FIX: Updated focus ring to ring-2 ring-indigo-100
                                                className="w-full bg-gray-50 hover:bg-gray-100 border border-transparent focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition-all placeholder-gray-400"
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors border-none outline-none cursor-pointer">
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-8 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 border-none outline-none cursor-pointer"
                >
                    <Check className="w-4 h-4" /> Save Specifications
                </button>
            </div>
        </motion.div>
    </div>
  );
}