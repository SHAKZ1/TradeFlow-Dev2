// app/components/ScrollToTop.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const ScrollToTop = () => {
  // Get the current page's path
  const pathname = usePathname();

  // This useEffect hook will run every time the pathname changes (i.e., on every navigation)
  useEffect(() => {
    // This is the core of the fix: it programmatically scrolls the window to the top left corner.
    window.scrollTo(0, 0);
  }, [pathname]); // The effect depends on the pathname

  // This component doesn't render any visible HTML, it only contains logic.
  return null;
};