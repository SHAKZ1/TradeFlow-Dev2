'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadStatus } from '../../data';

interface MoveToDropdownProps {
  currentStatus: LeadStatus;
  onMove: (status: LeadStatus) => void;
}

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new-lead', label: 'New Lead', color: 'bg-blue-500' },
  { id: 'quote-sent', label: 'Quote Sent', color: 'bg-yellow-500' },
  { id: 'job-booked', label: 'Job Booked', color: 'bg-green-500' },
  { id: 'job-complete', label: 'Job Complete', color: 'bg-purple-500' },
  { id: 'previous-jobs', label: 'Previous Jobs', color: 'bg-gray-500' },
];

export function MoveToDropdown({ currentStatus, onMove }: MoveToDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  // Refs for both the trigger and the content
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, 
        left: rect.right - 192 
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // FIXED: Check if click is outside BOTH the button AND the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedButton = buttonRef.current && buttonRef.current.contains(target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedButton && !clickedDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm transition-all duration-200 outline-none border-none cursor-pointer
            ${isOpen 
                ? 'ring-2 ring-primary/10 text-primary' 
                : 'ring-1 ring-gray-200 text-gray-600 hover:ring-gray-300 hover:text-gray-900'
            }`}
        style={{ border: 'none' }}
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold tracking-wide">Move</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* PORTAL DROPDOWN */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef} // ATTACH REF HERE
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-[9999] w-48 bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden"
            style={{ 
                top: coords.top, 
                left: coords.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {STAGES.map((stage) => {
                const isActive = currentStatus === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log(`👉 Option Clicked: ${stage.id}`);
                        onMove(stage.id);
                        setIsOpen(false);
                    }}
                    disabled={isActive}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all text-left border-none outline-none cursor-pointer
                        ${isActive 
                            ? 'bg-transparent text-primary font-bold cursor-default' 
                            : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                        }`}
                    style={{ border: 'none' }}
                  >
                    <div className={`w-2 h-2 rounded-full ${stage.color} shadow-sm shrink-0`} />
                    <span className="flex-1">{stage.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}