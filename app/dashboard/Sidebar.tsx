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
  User
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
  { label: 'Analytics', href: '/dashboard/reports/analytics', icon: BarChart3, isAI: true },
  { label: 'Ad Intelligence', href: '/dashboard/reports/ads', icon: Target, isAI: true },
  { label: 'AI Advisor', href: '/dashboard/reports/ai-strategy', icon: Sparkles, isAI: true },
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
  const defaultLogo = "/TRADEFLOWNEWLOGO2.png"

  const sidebarWidth = isCollapsed ? 'w-[80px]' : 'w-[260px]';
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR CONTAINER (Glassmorphism) */}
      <motion.aside 
        className={`fixed top-0 left-0 z-50 h-screen bg-[#F5F5F7]/90 backdrop-blur-2xl border-r border-gray-200/60 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 ${sidebarWidth} flex flex-col overflow-visible`}
      >
        
        {/* TOGGLE BUTTON (Floating Pill) */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute -right-3 top-9 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-[#1D1D1F] hover:border-gray-300 shadow-sm transition-all duration-200 outline-none focus:outline-none cursor-pointer group"
        >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* HEADER / LOGO */}
        <div className="h-20 flex items-center justify-center shrink-0 relative border-b border-gray-200/50 mx-4">
          {!isCollapsed ? (
            <Link href="/dashboard" className="relative w-32 h-8 block transition-all hover:opacity-80">
               <Image src={companyBanner || defaultBanner} alt="Logo" fill className="object-contain" priority />
            </Link>
          ) : (
            <Link href="/dashboard" className="relative w-8 h-8 block transition-transform hover:scale-105">
               <Image src={companyLogo || defaultLogo} alt="Logo" fill className="object-contain" priority />
            </Link>
          )}
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden absolute right-0 p-2 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* NAVIGATION AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 custom-scrollbar flex flex-col gap-8">
          
          {/* SECTION 1: MAIN */}
          <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative no-underline outline-none
                      ${isActive 
                        ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/20' 
                        : 'text-[#424245] hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm'}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-[#86868B] group-hover:text-[#1D1D1F]'} transition-colors`} strokeWidth={2} />
                    {!isCollapsed && <span className="text-[13px] font-medium tracking-tight">{item.label}</span>}
                    
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1D1D1F] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl translate-x-[-5px] group-hover:translate-x-0 duration-200">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
          </div>

          {/* SECTION 2: PIPELINE */}
          <div className="flex flex-col gap-1">
            {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-[#86868B] uppercase tracking-widest">
                    Pipeline
                </div>
            )}
            {isCollapsed && <div className="h-px w-8 mx-auto bg-gray-200 mb-2" />}

            {PIPELINE_ITEMS.map((sub) => {
              const isActive = pathname === sub.href;
              return (
                <Link 
                  key={sub.href} 
                  href={sub.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline outline-none relative group
                    ${isActive ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#424245] hover:text-[#1D1D1F] hover:bg-white/60'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <sub.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? sub.color : 'text-[#86868B] group-hover:text-[#1D1D1F]'}`} strokeWidth={2} />
                  {!isCollapsed && <span className="text-[13px] font-medium tracking-tight">{sub.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1D1D1F] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl translate-x-[-5px] group-hover:translate-x-0 duration-200">
                      {sub.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* SECTION 3: INTELLIGENCE */}
          <div className="flex flex-col gap-1">
            {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-[#86868B] uppercase tracking-widest">
                    Intelligence
                </div>
            )}
            {isCollapsed && <div className="h-px w-8 mx-auto bg-gray-200 mb-2" />}

            {REPORT_ITEMS.map((sub) => {
              const isActive = pathname === sub.href;
              return (
                <Link 
                  key={sub.href} 
                  href={sub.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline outline-none relative group
                    ${isActive ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#424245] hover:text-[#1D1D1F] hover:bg-white/60'}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <sub.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#5856D6]' : 'text-[#86868B] group-hover:text-[#1D1D1F]'}`} strokeWidth={2} />
                  {!isCollapsed && (
                      <div className="flex items-center gap-2 w-full">
                          <span className="text-[13px] font-medium tracking-tight">{sub.label}</span>
                          {sub.isAI && (
                              <span className="ml-auto px-1.5 py-0.5 rounded-md bg-[#5856D6]/10 text-[9px] font-bold text-[#5856D6]">
                                  AI
                              </span>
                          )}
                      </div>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1D1D1F] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl translate-x-[-5px] group-hover:translate-x-0 duration-200">
                      {sub.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

        </div>

        {/* USER PROFILE FOOTER (Glass Effect) */}
        <div className="p-4 border-t border-gray-200/60 bg-white/40 backdrop-blur-md" ref={userMenuRef}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`relative flex items-center gap-3 transition-all duration-200 cursor-pointer group p-2 rounded-xl hover:bg-white/60
            ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D1D1F] to-[#424245] flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white overflow-hidden shrink-0">
              {user?.imageUrl ? (
                  <Image src={user.imageUrl} alt="User" width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                  <span>{user?.firstName?.[0] || 'U'}</span>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="flex flex-col">
                    <p className="text-[13px] font-semibold text-[#1D1D1F] truncate">
                        {user?.fullName || 'User'}
                    </p>
                    <p className="text-[10px] text-[#86868B] truncate font-medium">Pro Plan</p>
                </div>
                <MoreVertical className="w-4 h-4 text-[#86868B] group-hover:text-[#1D1D1F]" />
              </div>
            )}

            {/* QUINTILLION DOLLAR DROPDOWN */}
            <AnimatePresence>
                {isUserMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute bottom-full mb-4 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/60 overflow-hidden z-50 p-1.5
                            ${isCollapsed ? 'left-0 w-56' : 'left-0 right-0'}
                        `}
                    >
                        <div className="flex flex-col gap-0.5">
                            {/* SETTINGS */}
                            <Link 
                                href="/dashboard/settings"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-[#1D1D1F] hover:bg-[#007AFF] hover:text-white rounded-lg transition-colors no-underline outline-none group/item"
                            >
                                <Settings className="w-4 h-4 text-[#86868B] group-hover/item:text-white" />
                                Settings
                            </Link>

                            <div className="h-px bg-gray-200/60 my-1 mx-2" />

                            {/* SIGN OUT */}
                            <button 
                                onClick={() => { setIsUserMenuOpen(false); setIsSignOutOpen(true); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white rounded-lg transition-colors text-left border-none outline-none cursor-pointer group/item"
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

      {/* SIGN OUT MODAL */}
      <SignOutModal 
        isOpen={isSignOutOpen} 
        onClose={() => setIsSignOutOpen(false)} 
        onConfirm={handleLogoutConfirm} 
      />
    </>
  );
}