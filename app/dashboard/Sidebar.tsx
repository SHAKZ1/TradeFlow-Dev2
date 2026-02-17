'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  X,
  LogOut,
  Inbox,
  BarChart3,
  Target,
  Sparkles,
  Blocks,
  UserPlus,
  FileText,
  CalendarCheck,
  CheckCircle,
  Archive,
  XCircle,
  MoreVertical,
  Lock
} from 'lucide-react';
import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';
import { SignOutModal } from './components/SignOutModal';

// --- CONFIGURATION ---
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
  { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
  { label: 'Integrations', href: '/dashboard/integrations', icon: Blocks },
];

const PIPELINE_ITEMS = [
  { label: 'New Lead', href: '/dashboard/pipeline/new-lead', icon: UserPlus, color: 'text-[#007AFF]' },
  { label: 'Quote Sent', href: '/dashboard/pipeline/quote-sent', icon: FileText, color: 'text-[#FF9500]' },
  { label: 'Job Booked', href: '/dashboard/pipeline/job-booked', icon: CalendarCheck, color: 'text-[#AF52DE]' },
  { label: 'Job Complete', href: '/dashboard/pipeline/job-complete', icon: CheckCircle, color: 'text-[#34C759]' },
  { label: 'Previous Jobs', href: '/dashboard/pipeline/previous-jobs', icon: Archive, color: 'text-[#8E8E93]' },
  { label: 'Lost Leads', href: '/dashboard/pipeline/lost', icon: XCircle, color: 'text-[#FF3B30]' },
];

const REPORT_ITEMS = [
  { label: 'Analytics', href: '/dashboard/reports/analytics', icon: BarChart3 },
  // PREMIUM LOCKED FEATURES (FOMO ENABLED)
  { label: 'Ads ROI', href: '#', icon: Target, isLocked: true },
  { label: 'AI Advisor', href: '#', icon: Sparkles, isLocked: true },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  companyLogo?: string | null;
  companyBanner?: string | null;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed, companyLogo, companyBanner }: SidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const defaultBanner = "/tradeflow-logo-trimmed-transparent.png";
  const defaultLogo = "/TRADEFLOWNEWLOGO2.png";

  const sidebarWidth = isCollapsed ? 'w-[84px]' : 'w-[260px]';
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogoutConfirm = async () => {
      await signOut(() => router.push('/sign-in'));
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR CONTAINER */}
      <motion.aside 
        className={`fixed top-0 left-0 z-50 h-screen bg-[#F5F5F7]/90 backdrop-blur-3xl border-r border-white/20 transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 ${sidebarWidth} flex flex-col overflow-visible shadow-[0_0_40px_rgba(0,0,0,0.02)]`}
      >
        
        {/* COLLAPSE TOGGLE */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3.5 top-10 z-50 w-7 h-7 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-[#0038A8] hover:border-[#0038A8]/30 shadow-sm transition-all duration-300 outline-none cursor-pointer group active:scale-90"
        >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* LOGO SECTION */}
        <div className="h-24 flex items-center justify-center shrink-0 relative mx-6">
          {!isCollapsed ? (
            <Link href="/dashboard" className="relative w-40 h-10 block transition-all duration-300 hover:opacity-80 active:scale-95">
               <Image src={companyBanner || defaultBanner} alt="Logo" fill className="object-contain" priority />
            </Link>
          ) : (
            <Link href="/dashboard" className="relative w-10 h-10 block transition-all duration-300 hover:scale-110 active:scale-90">
               <Image src={companyLogo || defaultLogo} alt="Logo" fill className="object-contain" priority />
            </Link>
          )}
        </div>

        {/* NAV CONTENT */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-4 custom-scrollbar flex flex-col gap-8">
          
          {/* MAIN NAV */}
          <div className="flex flex-col gap-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 group relative no-underline outline-none active:scale-[0.97]
                      ${isActive 
                        ? 'bg-[#0038A8] text-white shadow-[0_8px_16px_rgba(0,56,168,0.2)]' 
                        : 'text-[#424245] hover:bg-white hover:shadow-sm hover:text-[#1D1D1F]'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon className={`w-[20px] h-[20px] shrink-0 ${isActive ? 'text-white' : 'text-[#86868B] group-hover:text-[#0038A8]'} transition-colors`} strokeWidth={isActive ? 2.5 : 2} />
                    {!isCollapsed && <span className="text-[14px] font-semibold tracking-tight">{item.label}</span>}
                  </Link>
                );
              })}
          </div>

          {/* PIPELINE SECTION */}
          <div className="flex flex-col gap-1.5">
            {!isCollapsed && (
                <div className="px-4 mb-2 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.1em] opacity-60">
                    Pipeline
                </div>
            )}
            {isCollapsed && <div className="h-px w-8 mx-auto bg-gray-200/60 mb-4" />}

            {PIPELINE_ITEMS.map((sub) => {
              const isActive = pathname === sub.href;
              return (
                <Link 
                  key={sub.href} 
                  href={sub.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 no-underline outline-none relative group active:scale-[0.97]
                    ${isActive ? 'bg-white shadow-md text-[#1D1D1F] ring-1 ring-black/[0.03]' : 'text-[#424245] hover:text-[#1D1D1F] hover:bg-white/60'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <sub.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? sub.color : 'text-[#86868B] group-hover:text-[#1D1D1F]'}`} strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span className="text-[13px] font-semibold tracking-tight">{sub.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* INTELLIGENCE SECTION (FOMO ENABLED) */}
          <div className="flex flex-col gap-1.5">
            {!isCollapsed && (
                <div className="px-4 mb-2 text-[11px] font-bold text-[#86868B] uppercase tracking-[0.1em] opacity-60">
                    Intelligence
                </div>
            )}
            {isCollapsed && <div className="h-px w-8 mx-auto bg-gray-200/60 mb-4" />}

            {REPORT_ITEMS.map((sub: any) => {
              const isActive = pathname === sub.href;
              
              // --- RENDER LOCKED ITEM (APPLE PREMIUM FOMO VERSION) ---
              if (sub.isLocked) {
                return (
                  <div 
                    key={sub.label}
                    className={`group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl overflow-hidden cursor-default
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    {/* 1. THE "BREATHING" BACKGROUND GLOW */}
                    <motion.div 
                      animate={{ 
                        opacity: [0.03, 0.08, 0.03],
                        scale: [0.9, 1.1, 0.9]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 blur-xl"
                    />

                    {/* 2. THE PRISMATIC SHIMMER (Light Sweep) */}
                    <motion.div 
                      initial={{ x: '-100%', skewX: -20 }}
                      animate={{ x: '200%', skewX: -20 }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3, 
                        ease: [0.4, 0, 0.2, 1],
                        repeatDelay: 2
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent z-10 pointer-events-none"
                    />

                    {/* 3. THE ICON (Iridescent Treatment) */}
                    <div className="relative z-20">
                      <sub.icon 
                        className="w-[20px] h-[20px] shrink-0 text-gray-400/80" 
                        strokeWidth={2} 
                      />
                      <div className="absolute inset-0 blur-sm bg-indigo-400/20 -z-10" />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full relative z-20">
                        <span className="text-[14px] font-semibold tracking-tight text-gray-400/70">
                          {sub.label}
                        </span>
                        
                        {/* 4. THE "SOON" BADGE (Glassmorphism) */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                           <motion.div 
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-1 h-1 rounded-full bg-[#0038A8]" 
                           />
                           <span className="text-[9px] font-black text-[#0038A8] uppercase tracking-widest">Soon</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // --- RENDER ACTIVE ITEM ---
              return (
                <Link 
                  key={sub.href} 
                  href={sub.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 no-underline outline-none relative group active:scale-[0.97]
                    ${isActive ? 'bg-white shadow-md text-[#1D1D1F] ring-1 ring-black/[0.03]' : 'text-[#424245] hover:text-[#1D1D1F] hover:bg-white/60'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <sub.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#0038A8]' : 'text-[#86868B] group-hover:text-[#0038A8]'}`} strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span className="text-[13px] font-semibold tracking-tight">{sub.label}</span>}
                </Link>
              );
            })}
          </div>

        </div>

        {/* USER PROFILE FOOTER */}
        <div className="p-4 border-t border-gray-200/40 bg-white/20 backdrop-blur-md" ref={userMenuRef}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`relative flex items-center gap-3 transition-all duration-300 cursor-pointer group p-2.5 rounded-2xl hover:bg-white/80 active:scale-95
            ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0038A8] to-[#0055FF] flex items-center justify-center text-white font-bold text-xs shadow-lg ring-2 ring-white overflow-hidden shrink-0">
              {user?.imageUrl ? (
                  <Image src={user.imageUrl} alt="User" width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                  <span className="text-[14px]">{user?.firstName?.[0] || 'U'}</span>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-[14px] font-bold text-[#1D1D1F] truncate tracking-tight">
                        {user?.fullName || 'User'}
                    </p>
                    <p className="text-[11px] text-[#86868B] truncate font-bold uppercase tracking-tighter opacity-70">Pro Plan</p>
                </div>
                <MoreVertical className="w-4 h-4 text-[#86868B] group-hover:text-[#1D1D1F] transition-colors" />
              </div>
            )}

            {/* APPLE STYLE DROPDOWN */}
            <AnimatePresence>
                {isUserMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className={`absolute bottom-full mb-4 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden z-50 p-1.5
                            ${isCollapsed ? 'left-0 w-56' : 'left-0 right-0'}
                        `}
                    >
                        <div className="flex flex-col gap-1">
                            <Link 
                                href="/dashboard/settings"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-semibold text-[#1D1D1F] hover:bg-[#0038A8] hover:text-white rounded-xl transition-all no-underline outline-none group/item"
                            >
                                <Settings className="w-4 h-4 text-[#86868B] group-hover/item:text-white" />
                                Settings
                            </Link>

                            <div className="h-px bg-gray-200/50 my-1 mx-2" />

                            <button 
                                onClick={() => { setIsUserMenuOpen(false); setIsSignOutOpen(true); }}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[14px] font-semibold text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white rounded-xl transition-all text-left border-none outline-none cursor-pointer group/item"
                            >
                                <LogOut className="w-4 h-4 text-[#FF3B30] group-hover/item:text-white" />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

      </motion.aside>

      <SignOutModal 
        isOpen={isSignOutOpen} 
        onClose={() => setIsSignOutOpen(false)} 
        onConfirm={handleLogoutConfirm} 
      />
    </>
  );
}