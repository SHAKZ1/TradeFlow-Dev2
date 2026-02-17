'use client';
import { useState, useEffect, FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export const Header: FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] flex justify-center p-6 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
  pointer-events-auto flex items-center justify-between px-8 py-3 rounded-full transition-all duration-500 ease-in-out
  ${scrolled 
    ? 'w-full max-w-[900px] bg-[#FBFBFC]/70 backdrop-blur-xl backdrop-saturate-150 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.02),0_16px_32px_rgba(0,0,0,0.02)]' 
    : 'w-full max-w-[1200px] bg-transparent border border-transparent'}
`}
      >
        <Link href="/" className="relative w-36 h-8 transition-transform active:scale-95">
          <Image src="/tradeflow-logo-trimmed-transparent.png" alt="TradeFlow UK" fill className="object-contain" priority />
        </Link>
        
        <nav className="hidden md:flex items-center gap-10">
          {['The Problem', 'The Cost', 'The Engine'].map((item) => (
            <Link key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-[13px] font-bold text-[#1D1D1F]/40 hover:text-[#0038A8] transition-colors no-underline uppercase tracking-widest">
              {item}
            </Link>
          ))}
          <Link href="#book-a-call" className="px-6 py-2.5 bg-[#0038A8] text-white text-[13px] font-black rounded-full shadow-xl shadow-[#0038A8]/20 hover:bg-[#002C85] transition-all active:scale-95 no-underline uppercase tracking-wider">
              Get Your Blueprint
          </Link>
        </nav>
      </motion.div>
    </header>
  );
};