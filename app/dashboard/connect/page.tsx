'use client';

import { motion } from 'framer-motion';
import { Link as LinkIcon, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ConnectPage() {
  const clientId = process.env.NEXT_PUBLIC_GHL_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/callback`;
  
  // UPDATED: Comprehensive Scope List based on your GHL settings
  const scopes = [
    'locations.readonly',
    'opportunities.write',
    'opportunities.readonly',
    'contacts.write',
    'contacts.readonly',
    'conversations.write',
    'conversations.readonly',
    'conversations/message.write', // <--- CRITICAL FOR SMS/EMAIL
    'conversations/message.readonly',
    'users.readonly',
    'locations/customFields.readonly', // <--- For the Scanner
    'locations/customFields.write'
  ].join(' ');

  const ghlAuthUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${redirectUri}&client_id=${clientId}&scope=${scopes}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row"
      >
        {/* LEFT: Visual */}
        <div className="bg-[#0F172A] p-10 flex flex-col justify-between md:w-2/5 relative overflow-hidden">
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 mb-6">
                    <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight">Connect your Business</h2>
                <p className="text-indigo-200 text-sm mt-3 leading-relaxed">
                    Link your GoHighLevel account to unlock the power of TradeFlow.
                </p>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10" />
        </div>

        {/* RIGHT: Action */}
        <div className="p-10 md:w-3/5 flex flex-col justify-center">
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Sync your Leads</h4>
                            <p className="text-xs text-gray-500 mt-1">Automatically import opportunities from your pipeline.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Two-Way Communication</h4>
                            <p className="text-xs text-gray-500 mt-1">Send SMS and Emails directly from the dashboard.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <a 
                        href={ghlAuthUrl}
                        className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 no-underline"
                    >
                        Connect GoHighLevel <ArrowRight className="w-4 h-4" />
                    </a>
                    <p className="text-[10px] text-center text-gray-400 mt-4">
                        Secure connection via OAuth 2.0
                    </p>
                </div>
            </div>
        </div>
      </motion.div>

    </div>
  );
}