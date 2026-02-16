'use client';
import { useState, useEffect, FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const logoHref = pathname === '/' ? '#top' : '/';

  return (
    <>
      <header className="lp-header">
        <div className="lp-container h-full flex items-center justify-between px-6">
          
          {/* LOGO */}
          <Link href={logoHref} className="relative w-40 h-10 group" onClick={() => setIsMenuOpen(false)}>
            <Image
              src="/tradeflow-logo-trimmed-transparent.png"
              alt="TradeFlow UK"
              fill
              className="object-contain transition-opacity duration-300 group-hover:opacity-80"
              priority
            />
          </Link>
          
          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-gray-500 hover:text-black transition-colors no-underline">The Problem</Link>
            <Link href="/#calculator" className="text-sm font-medium text-gray-500 hover:text-black transition-colors no-underline">The Cost</Link>
            <Link href="/#solution" className="text-sm font-medium text-gray-500 hover:text-black transition-colors no-underline">The Engine</Link>
            <Link 
                href="/#book-a-call" 
                className="lp-button lp-button-primary"
                style={{ padding: '8px 20px', fontSize: '14px' }}
            >
                Get Your Blueprint
            </Link>
          </nav>

          {/* MOBILE TOGGLE */}
          <button className="md:hidden p-2 text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-32 px-8 flex flex-col gap-8 md:hidden">
            <Link href="/#features" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-gray-900 no-underline">The Problem</Link>
            <Link href="/#calculator" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-gray-900 no-underline">The Cost</Link>
            <Link href="/#solution" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-gray-900 no-underline">The Engine</Link>
            <Link href="/#book-a-call" onClick={() => setIsMenuOpen(false)} className="lp-button lp-button-primary w-full">Get Your Blueprint</Link>
        </div>
      )}
    </>
  );
};