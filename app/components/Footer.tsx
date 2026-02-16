'use client';
import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export const Footer: FC = () => {
  return (
    <footer className="bg-[#0F172A] text-white py-20 border-t border-white/10">
      <div className="lp-container">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16">
          
          {/* BRAND IDENTITY */}
          <div className="flex-1 max-w-sm">
            <Link href="/" className="block w-32 h-8 relative mb-12 opacity-100 hover:opacity-80 transition-opacity">
              <Image src="/tradeflow-logo-trimmed-transparent.png" width={200} height={50} alt="TradeFlow"  className="object-contain brightness-0 invert" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              The operating system for the modern tradesperson. <br />
              Stop chasing. Start closing.
            </p>
            <div className="flex gap-5 mt-8">
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* NAVIGATION GRID */}
          <div className="flex gap-20">
            <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Platform</span>
                <Link href="/#features" className="text-sm text-gray-300 hover:text-white transition-colors no-underline">Features</Link>
                <Link href="/#calculator" className="text-sm text-gray-300 hover:text-white transition-colors no-underline">ROI Calculator</Link>
                <Link href="/#solution" className="text-sm text-gray-300 hover:text-white transition-colors no-underline">Pricing</Link>
            </div>
            <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Legal</span>
                <Link href="/terms" className="text-sm text-gray-300 hover:text-white transition-colors no-underline">Terms</Link>
                <Link href="/privacy" className="text-sm text-gray-300 hover:text-white transition-colors no-underline">Privacy</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 mt-16 pt-8">
            <p>&copy; {new Date().getFullYear()} TradeFlow UK. All Rights Reserved.</p>
            <p>Designed for Excellence.</p>
        </div>
      </div>
    </footer>
  );
};