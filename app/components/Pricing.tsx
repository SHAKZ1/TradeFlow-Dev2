'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Lock } from 'lucide-react';

const PLANS = [
  {
    id: 'organiser',
    name: 'The Organiser',
    tagline: 'For the Solo Tradesman',
    price: 99,
    description: "Stop running your business from a messy van dashboard. Get organized, get paid faster, and look professional.",
    features: [
      "Never miss a lead (Unified Inbox)",
      "Get paid on site (One-click Invoicing)",
      "No more double-booking (Smart Calendar)",
      "Never miss a review (Automatic and Tracked)",
      "Look professional (Stripe Payments)"
    ],
    cta: 'Start Organizing',
    theme: 'light'
  },
  {
    id: 'accelerator',
    name: 'The Accelerator',
    tagline: 'For Growing Teams (2-5)',
    price: 199,
    popular: true,
    description: "The engine for scaling. Automate the busywork and stay on top of your numbers, so you can spend more time on what actually matters.",
    features: [
      "Everything in Organiser",
      "Capture every missed call (Auto-Text)",
      "Heatmaps and Forecasts (Advanced Analytics)",
      "Know your profit (Expenses & Profit Calculator)",
      "Chase invoices automatically (Auto-Nudge)"
    ],
    cta: 'Start Scaling',
    theme: 'dark'
  },
  {
    id: 'dominator',
    name: 'The Dominator',
    tagline: 'For Established Firms',
    price: 399,
    isLocked: true, 
    description: "Total market dominance. Use AI to predict revenue, analyse bottlenecks, optimise ad spend, and provide weekly, actionable scaling advice",
    features: [
      "Everything in Accelerator",
      "Stop wasting ad spend (ROI Tracking)",
      "Weekly strategy reports (AI Business Advisor)",
    ],
    cta: 'Join the Waitlist',
    theme: 'light'
  }
];

export const Pricing = () => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      
      {/* TOGGLE */}
      <div className="flex justify-center mb-16">
        <div className="bg-[#E5E5EA] p-1 rounded-full flex relative w-[280px] h-[44px]">
            <motion.div 
                className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm border border-black/5 z-0"
                initial={false}
                animate={{ x: billing === 'monthly' ? 0 : '100%', width: 'calc(50% - 4px)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ left: '2px' }}
            />
            <button onClick={() => setBilling('monthly')} className={`flex-1 relative z-10 text-[13px] font-semibold cursor-pointer bg-transparent border-none outline-none ${billing === 'monthly' ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>Monthly</button>
            <button onClick={() => setBilling('yearly')} className={`flex-1 relative z-10 text-[13px] font-semibold cursor-pointer bg-transparent border-none outline-none ${billing === 'yearly' ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>Yearly <span className="text-[9px] text-[#34C759] font-bold">(-20%)</span></button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan, i) => {
            const isDark = plan.theme === 'dark';
            const price = billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;

            return (
                <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`relative rounded-[32px] p-8 flex flex-col transition-all duration-500
                        ${isDark ? 'bg-[#1D1D1F] text-white shadow-2xl scale-105 z-10' : 'bg-white text-[#1D1D1F] border border-gray-200 shadow-sm'}
                    `}
                >
                    {/* --- POPULAR TAG (OUTSIDE OVERFLOW) --- */}
                    {plan.popular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] whitespace-nowrap">
                            <div className="bg-[#0038A8] text-white text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                                Most Popular
                            </div>
                        </div>
                    )}

                    {/* --- BACKGROUND EFFECTS WRAPPER (HANDLES OVERFLOW) --- */}
                    <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none z-0">
                        {plan.isLocked && (
                            <>
                                <motion.div 
                                    animate={{ opacity: [0.04, 0.1, 0.04], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 blur-[80px]"
                                />
                                <motion.div 
                                    initial={{ x: '-100%', skewX: -20 }}
                                    animate={{ x: '200%', skewX: -20 }}
                                    transition={{ repeat: Infinity, duration: 5, ease: [0.4, 0, 0.2, 1], repeatDelay: 4 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                />
                            </>
                        )}
                    </div>

                    {/* --- CONTENT LAYER --- */}
                    <div className="relative z-20 flex flex-col h-full">
                        <div className="mb-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                                {plan.isLocked && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-sm">
                                        <div className="w-1 h-1 rounded-full bg-[#5856D6]" />
                                        <span className="text-[10px] font-black text-[#5856D6] uppercase">Coming Soon</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">{plan.tagline}</p>
                        </div>

                        <div className="mb-6 flex items-baseline gap-1">
                            <span className={`text-4xl font-bold tracking-tight ${plan.isLocked ? 'opacity-30' : ''}`}>£{price}</span>
                            <span className="text-sm font-medium opacity-60">/mo</span>
                        </div>

                        <p className={`text-[13px] leading-relaxed mb-6 font-medium opacity-80 ${plan.isLocked ? 'opacity-50' : ''}`}>
                            {plan.description}
                        </p>

                        <ul className="space-y-3 mb-8 flex-1">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className={`flex items-start gap-3 text-[13px] ${plan.isLocked ? 'opacity-40' : ''}`}>
                                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-green-100 text-green-700'}`}>
                                        <Check className="w-2.5 h-2.5" strokeWidth={4} />
                                    </div>
                                    <span className="leading-tight">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <a 
                            href={plan.isLocked ? undefined : "#book-a-call"}
                            style={{ textDecoration: 'none' }}
                            className={`w-full py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95
                                ${plan.isLocked 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                    : isDark ? 'bg-white text-black hover:bg-gray-100 shadow-lg' : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] border border-gray-200'
                                }`}
                        >
                            {plan.isLocked && <Lock className="w-3.5 h-3.5" />}
                            {plan.cta} {!plan.isLocked && <ArrowRight className="w-3.5 h-3.5" />}
                        </a>
                        
                        <p className="text-[9px] text-center mt-4 font-bold uppercase tracking-widest opacity-40">
                            One-time setup fee of £199 applies.
                        </p>
                    </div>
                </motion.div>
            );
        })}
      </div>
    </div>
  );
};