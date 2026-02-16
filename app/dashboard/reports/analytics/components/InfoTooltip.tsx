'use client';

import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function InfoTooltip({ text }: { text: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Update position on hover
  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 10, // 10px gap below the icon
        left: rect.left + rect.width / 2 // Center horizontally
      });
      setIsOpen(true);
    }
  };

  // Close on scroll to prevent floating artifacts
  useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  return (
    <>
      {/* TRIGGER ICON */}
      <div 
        ref={triggerRef}
        className="relative inline-flex items-center justify-center ml-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsOpen(false)}
      >
        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors cursor-help" />
      </div>

      {/* PORTAL CONTENT */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed z-[99999] w-64 bg-gray-900 text-white text-[11px] font-medium leading-relaxed p-3 rounded-xl shadow-2xl text-center pointer-events-none"
              style={{
                top: coords.top,
                left: coords.left,
                transform: 'translateX(-50%)' // Center align based on left coord
              }}
            >
              {text}
              
              {/* ARROW (Pointing Up) */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}