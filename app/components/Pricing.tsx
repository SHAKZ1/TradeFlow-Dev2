'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

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
      "View business performance (Analytics)",
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
    description: "Total market dominance. Use AI to predict revenue, analyse bottlenecks, optimise ad spend, and provide weekly, actionable scaling advice",
    features: [
      "Everything in Accelerator",
      "Stop wasting ad spend (ROI Tracking)",
      "Heatmaps and Forecasts (Advanced Analytics)",
      "Weekly strategy reports (AI Business Advisor)",
    //   "Dedicated Success Manager"
    ],
    cta: 'Start Dominating',
    theme: 'light'
  }
];

export const Pricing = () => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      
      {/* TOGGLE (Apple Segmented Control - Fixed) */}
      <div className="flex justify-center mb-16">
        <div className="bg-[#E5E5EA] p-1 rounded-full flex relative w-[280px] h-[44px]">
            {/* The Sliding Pill */}
            <motion.div 
                className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm border border-black/5 z-0"
                initial={false}
                animate={{ 
                    x: billing === 'monthly' ? 0 : '100%', 
                    width: 'calc(50% - 4px)' // Perfect fit calculation
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ left: '2px' }}
            />
            
            {/* Buttons */}
            <button 
                onClick={() => setBilling('monthly')}
                className={`flex-1 relative z-10 text-[13px] font-semibold transition-colors duration-200 outline-none border-none cursor-pointer bg-transparent ${billing === 'monthly' ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}
            >
                Monthly
            </button>
            <button 
                onClick={() => setBilling('yearly')}
                className={`flex-1 relative z-10 text-[13px] font-semibold transition-colors duration-200 outline-none border-none cursor-pointer bg-transparent flex items-center justify-center gap-1 ${billing === 'yearly' ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}
            >
                Yearly <span className="text-[9px] text-[#34C759] font-bold tracking-tight">(-20%)</span>
            </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                    className={`relative rounded-[24px] p-8 flex flex-col h-full transition-all duration-300
                        ${isDark 
                            ? 'bg-[#1D1D1F] text-white shadow-2xl shadow-black/30 scale-105 z-10' 
                            : 'bg-white text-[#1D1D1F] border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300'
                        }`}
                    style={{
                        // Apple-style "Glass Edge" highlight for the dark card
                        boxShadow: isDark ? '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' : undefined
                    }}
                >
                    {/* POPULAR BADGE */}
                    {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#007AFF] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/30 border border-blue-400/50">
                            Most Popular
                        </div>
                    )}

                    {/* HEADER */}
                    <div className="mb-6">
                        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                            {plan.name}
                        </h3>
                        <p className={`text-[11px] font-bold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                            {plan.tagline}
                        </p>
                    </div>

                    {/* PRICE */}
                    <div className="mb-6 flex items-baseline gap-1">
                        <span className="text-5xl font-bold tracking-tight">£{price}</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/mo
                            {billing === 'yearly' ? <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}> (billed annually)</span> : ""}
                        </span>
                    </div>

                    {/* DESCRIPTION */}
                    <p className={`text-[13px] leading-relaxed mb-8 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {plan.description}
                    </p>

                    {/* FEATURES */}
                    <ul className="space-y-3 mb-10 flex-1">
                        {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-[13px]">
                                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 
                                    ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-green-100 text-green-700'}`}>
                                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                </div>
                                <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                                    {feature.includes('Everything') ? <strong>{feature}</strong> : feature}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA BUTTON */}
                    <a 
                        href="#book-a-call"
                        style={{ textDecoration: 'none' }} // FORCE NO UNDERLINE
                        className={`w-full py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5
                            ${isDark 
                                ? 'bg-white text-black hover:bg-gray-100 shadow-lg shadow-white/5' 
                                : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] border border-gray-200'
                            }`}
                    >
                        {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    
                    {/* SETUP FEE NOTE */}
                    <p className={`text-[10px] text-center mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        One-time setup fee of £199 applies.
                    </p>
                </motion.div>
            );
        })}
      </div>
    </div>
  );
};