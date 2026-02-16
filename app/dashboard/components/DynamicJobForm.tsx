'use client';

import { useState, useEffect, useRef } from 'react';
import { CustomField } from '../settings/components/DocumentBuilder';
import { Calendar, Hash, Type, AlignLeft, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicJobFormProps {
  config: CustomField[];
  values: Record<string, any>;
  onChange: (newValues: Record<string, any>) => void;
}

// --- CUSTOM SELECT COMPONENT ---
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
        <div ref={containerRef} className="relative h-12">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-full bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-200 rounded-2xl px-4 flex items-center justify-between cursor-pointer transition-all
                ${isOpen ? 'bg-white border-[#007AFF]/30 ring-2 ring-[#007AFF]/10' : ''}`}
            >
                <span className={`text-sm font-medium truncate ${value ? 'text-[#1D1D1F]' : 'text-gray-400'}`}>
                    {value || placeholder || 'Select...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#007AFF]' : ''}`} />
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
                                className={`px-3 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-colors flex items-center justify-between
                                    ${value === opt ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                {opt}
                                {value === opt && <Check className="w-3.5 h-3.5 text-[#007AFF]" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function DynamicJobForm({ config, values, onChange }: DynamicJobFormProps) {
  
  const handleChange = (id: string, val: any) => {
    onChange({ ...values, [id]: val });
  };

  if (!config || config.length === 0) return null;

  return (
    // REMOVED: Outer grey container and Header
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {config.map((field) => {
            const val = values[field.id] || '';

            return (
                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">
                        {field.label}
                    </label>
                    
                    {field.type === 'dropdown' ? (
                        <QuintillionSelect 
                            value={val}
                            onChange={(v) => handleChange(field.id, v)}
                            options={field.options?.split(',').map(o => o.trim()) || []}
                            placeholder={field.placeholder}
                        />
                    ) : (
                        <div className="relative group">
                            {/* ICON */}
                            <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none group-focus-within:text-[#007AFF] transition-colors z-10">
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
                                    rows={3}
                                    className="w-full bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-200 focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-[#1D1D1F] outline-none transition-all resize-none placeholder-gray-400"
                                />
                            ) : (
                                <input
                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'datetime-local' : 'text'}
                                    value={val}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full h-12 bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-200 focus:bg-white focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/10 rounded-2xl pl-11 pr-4 text-sm font-medium text-[#1D1D1F] outline-none transition-all placeholder-gray-400"
                                />
                            )}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );
}