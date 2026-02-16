'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomSortSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

export function CustomSortSelect({ value, onChange, options }: CustomSortSelectProps) {
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

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div ref={containerRef} className="relative h-10 w-full">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-full pl-3 pr-2 bg-white rounded-xl flex items-center justify-between gap-2 border border-gray-200/60 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200 outline-none active:scale-95
                ${isOpen ? 'ring-2 ring-primary/10 border-primary/50' : ''}`}
            >
                <span className="text-xs font-semibold text-gray-700 tracking-wide">{selectedLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100/50 overflow-hidden z-50 p-1"
                    >
                        {options.map((opt) => {
                            const isSelected = value === opt.value;
                            return (
                                <button 
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all
                                        ${isSelected 
                                            ? 'bg-gray-100 text-gray-900' 
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    {opt.label}
                                    {isSelected && <Check className="w-3 h-3 text-primary" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}