'use client';

import { createContext, useContext, ReactNode } from 'react';

interface BrandingContextType {
  logoUrl?: string | null;
}

const BrandingContext = createContext<BrandingContextType>({});

export function BrandingProvider({ 
  children, 
  logoUrl 
}: { 
  children: ReactNode; 
  logoUrl?: string | null; 
}) {
  return (
    <BrandingContext.Provider value={{ logoUrl }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);