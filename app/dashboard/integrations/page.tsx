'use client';

import { useState, useEffect } from 'react';
import { IntegrationCard } from './components/IntegrationCard';
import { StripeModal } from './components/StripeModal';
import { BankModal } from './components/BankModal';
import { CreditCard, Link as LinkIcon, Mail, Facebook, Instagram, MapPin, RefreshCw, Landmark } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { useRouter } from 'next/navigation';

export default function IntegrationsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStripeOpen, setIsStripeOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const router = useRouter();

  const fetchStatus = async () => {
      const res = await fetch('/api/integrations/status');
      const data = await res.json();
      setStatus(data);
      setLoading(false);
  };

  useEffect(() => {
      fetchStatus();
  }, []);

  const handleGHLDisconnect = async () => {
      if (confirm("Are you sure? This will disconnect your CRM and stop all syncs.")) {
          setLoading(true);
          await fetch('/api/settings', { method: 'DELETE' });
          await fetchStatus();
          setLoading(false);
      }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-[1200px] mx-auto pt-8 px-4 md:px-8 pb-20 bg-[#F9FAFB] min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-10">
        <div>
            <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Integrations</h1>
            <p className="text-[13px] text-[#86868B] font-medium mt-2">Connect your tools to power the TradeFlow engine.</p>
        </div>
        <button 
            onClick={() => { setLoading(true); fetchStatus(); }}
            className="p-2.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-[#86868B] hover:text-[#1D1D1F] transition-colors shadow-sm outline-none cursor-pointer"
        >
            <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. STRIPE */}
        <IntegrationCard 
            title="Stripe Payments"
            description="Enable one-click invoicing, deposit collection and tracking via SMS and Email."
            icon={<CreditCard className="w-6 h-6" />}
            color="bg-[#635BFF]" // Stripe Blurple
            status={status.stripe.isConnected ? 'connected' : 'disconnected'}
            meta={status.stripe.isConnected ? `${status.stripe.mode} Mode Active` : 'Not Connected'}
            actionLabel="Manage Keys"
            onAction={() => setIsStripeOpen(true)}
        />

        {/* 2. BANK TRANSFER */}
        <IntegrationCard 
            title="Bank Transfer"
            description="Display your bank details on invoices for direct transfers."
            icon={<Landmark className="w-6 h-6" />}
            color="bg-[#34C759]" // System Green
            status={status.bank?.isConnected ? 'connected' : 'disconnected'}
            meta={status.bank?.isConnected ? 'Details Configured' : 'Not Configured'}
            actionLabel="Manage Details"
            onAction={() => setIsBankOpen(true)}
        />

        {/* 3. GOHIGHLEVEL */}
        <IntegrationCard 
            title="Secure Database"
            description="The core engine. Syncs contacts details, job opportunities, conversations and analytics."
            icon={<LinkIcon className="w-6 h-6" />}
            color="bg-[#007AFF]" // System Blue
            status={status.ghl.isConnected ? 'connected' : 'disconnected'}
            meta={status.ghl.locationName}
            actionLabel={status.ghl.isConnected ? "Disconnect" : "Connect"}
            variant={status.ghl.isConnected ? "danger" : "default"}
            onAction={status.ghl.isConnected ? handleGHLDisconnect : () => router.push('/dashboard/connect')}
        />

        {/* 4. UNIVERSAL PARSER */}
        <IntegrationCard 
            title="Lead & Review Parser"
            description="Auto-forward emails from Checkatrade, TrustATrader, Trustpilot and Yell to this address."
            icon={<Mail className="w-6 h-6" />}
            color="bg-[#AF52DE]" // System Purple
            status="connected"
            meta="Active Listener"
            copyValue={status.parser.email}
        />

        {/* 5. META */}
        <IntegrationCard 
            title="Meta (Facebook & Instagram)"
            description="Connects Facebook Messenger and Instagram DM's to the Unified Inbox."
            icon={<Facebook className="w-6 h-6" />}
            color="bg-[#1877F2]" // Facebook Blue
            status={status.ghl.facebook || status.ghl.instagram ? 'connected' : 'disconnected'}
            actionLabel="Connect via GHL"
            onAction={() => window.open('https://app.gohighlevel.com/settings/integrations', '_blank')}
        />

        {/* 6. GOOGLE BUSINESS */}
        <IntegrationCard 
            title="Google Business"
            description="Sync Google Business Profile messages and reviews directly to your dashboard."
            icon={<MapPin className="w-6 h-6" />}
            color="bg-[#4285F4]" // Google Blue
            status={status.ghl.google ? 'connected' : 'disconnected'}
            actionLabel="Connect via GHL"
            onAction={() => window.open('https://app.gohighlevel.com/settings/integrations', '_blank')}
        />

      </div>

      {/* MODALS */}
      <StripeModal 
        isOpen={isStripeOpen} 
        onClose={() => setIsStripeOpen(false)} 
        onSave={fetchStatus} 
      />

      <BankModal 
        isOpen={isBankOpen} 
        onClose={() => setIsBankOpen(false)} 
        onSave={fetchStatus}
        initialData={status?.bank}
      />

    </div>
  );
}