'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingScreen } from './components/LoadingScreen';
import { BrandingProvider } from './BrandingContext'; // <--- IMPORT
import { ToastProvider } from './components/ToastSystem';

export default function ClientLayout({
  children,
  isConnected,
  companyLogo,
  companyBanner // This is the full logo used for loading screen
}: {
  children: React.ReactNode;
  isConnected: boolean;
  companyLogo?: string | null;
  companyBanner?: string | null;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected && pathname !== '/dashboard/connect') router.push('/dashboard/connect');
    if (isConnected && pathname === '/dashboard/connect') router.push('/dashboard');
  }, [isConnected, pathname, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 || pathname === '/dashboard') setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]);

  if (!isConnected && pathname !== '/dashboard/connect') return <LoadingScreen logo={companyBanner} />; // Pass Banner

  if (pathname === '/dashboard/connect') return <>{children}</>;

  
  return (
    <BrandingProvider logoUrl={companyBanner}>
      <ToastProvider> {/* <--- ADD THIS */}
        <div className="min-h-screen bg-[#F9FAFB] flex">
          <Sidebar 
            isMobileOpen={isMobileOpen} 
            setIsMobileOpen={setIsMobileOpen}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            companyLogo={companyLogo}
            companyBanner={companyBanner}
          />

          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${isCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'}`}>
            <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider> {/* <--- ADD THIS */}
    </BrandingProvider>
  );
}