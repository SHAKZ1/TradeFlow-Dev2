'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CreditCard, Star, ArrowRight, Wallet, Bell, Check, ChevronRight, Lock } from 'lucide-react';

// --- NEPQ SCENARIOS ---
const SCENARIOS = [
  {
    id: 'missed-call',
    title: 'The £2,000 Phone Call',
    subtitle: 'Stop Burning Ad Spend',
    icon: Phone,
    color: 'bg-rose-500',
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    description: "You're under a sink or up a ladder. The phone rings. It's a new lead. You miss it. They call the next guy. You just lost £2,000.",
    solution: "TradeFlow detects the missed call and instantly texts them back: 'Hi, I'm on a job. How can I help?' You save the lead without putting down your tools."
  },
  {
    id: 'payment',
    title: 'The Cash Flow Gap',
    subtitle: 'Get Paid on Site',
    icon: Wallet,
    color: 'bg-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: "Sending an invoice on Friday night and waiting 30 days for payment is a recipe for stress. It kills your liquidity.",
    solution: "Generate a secure stripe payment link in 5 seconds. Text it to the client while you're still in the driveway. Money hits your bank before you hit the main road."
  },
  {
    id: 'review',
    title: 'The "Silent" Handshake',
    subtitle: 'Automated Reputation',
    icon: Star,
    color: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    description: "The best time to ask for a review is when the client is smiling at your work. Not 3 weeks later via a generic email they ignore.",
    solution: "One tap sends a branded review request. We route them directly to your Google Profile. Watch your 5-star rating compound automatically."
  },
];

export const MobileDemo = () => {
  const [activeTab, setActiveTab] = useState('missed-call');
  
  // --- LIVE LONDON TIME LOGIC ---
  const [timeString, setTimeString] = useState('09:41');
  const [dateString, setDateString] = useState('Tuesday, 24 October');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format Time (HH:MM)
      const time = new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'Europe/London',
      }).format(now);

      // Format Date (Weekday, Day Month)
      const date = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'Europe/London',
      }).format(now);

      setTimeString(time);
      setDateString(date);
    };

    updateTime(); // Initial set
    const interval = setInterval(updateTime, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      
      {/* LEFT: NARRATIVE CONTROL */}
      <div className="space-y-6">
        {SCENARIOS.map((scenario) => {
          const isActive = activeTab === scenario.id;
          return (
            <div 
              key={scenario.id}
              onClick={() => setActiveTab(scenario.id)}
              className={`group relative p-8 rounded-[24px] border transition-all duration-500 cursor-pointer overflow-hidden
                ${isActive 
                  ? 'bg-white border-gray-200 shadow-xl shadow-gray-200/50 scale-[1.02]' 
                  : 'bg-transparent border-transparent hover:bg-white/50'}`}
            >
              <div className="flex items-start gap-6 relative z-10">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500
                  ${isActive ? `${scenario.color} text-white` : 'bg-white text-gray-400 border border-gray-100'}`}>
                  <scenario.icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-lg font-bold transition-colors ${isActive ? 'text-[#1D1D1F]' : 'text-gray-500'}`}>
                      {scenario.title}
                    </h3>
                    {isActive && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${scenario.text} bg-white px-2 py-1 rounded-full shadow-sm`}>
                        {scenario.subtitle}
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-[15px] leading-relaxed transition-colors duration-300 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {scenario.description}
                  </p>

                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`mt-4 pt-4 border-t border-dashed ${scenario.text} border-opacity-20`}>
                          <p className="text-sm font-medium text-[#1D1D1F]">
                            <span className="font-bold text-[#0038A8]">The Fix:</span> {scenario.solution}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT: THE IPHONE 15 PRO (HIGH FIDELITY) */}
      <div className="relative mx-auto perspective-1000">
        
        {/* TITANIUM FRAME */}
        <div className="relative w-[350px] h-[700px] bg-[#1D1D1F] rounded-[60px] shadow-[0_0_0_4px_#3a3a3c,0_0_0_8px_#121212,0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10">
            
            {/* Screen Glare */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none z-50 rounded-[55px]" />

            {/* Dynamic Island */}
            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50 flex justify-center items-center transition-all duration-300">
                <div className="w-full h-full flex items-center justify-end px-4">
                   <div className="w-2 h-2 bg-[#0038A8] rounded-full animate-pulse" />
                </div>
            </div>

            {/* SCREEN CONTENT */}
            <div className="absolute inset-[10px] rounded-[50px] bg-black flex flex-col overflow-hidden z-20">
                
                {/* Status Bar (Global - Live London Time) */}
                <div className="absolute top-4 left-8 text-white text-[14px] font-bold z-40 mix-blend-difference">
                    {timeString}
                </div>
                <div className="absolute top-4 right-8 flex gap-1.5 z-40">
                    <div className="w-5 h-3 bg-white rounded-[2px] mix-blend-difference" />
                </div>

                {/* DYNAMIC SCREEN CONTENT */}
                <AnimatePresence mode="wait">
                    
                    {/* SCENARIO 1: MISSED CALL (iMessage Style) */}
                    {activeTab === 'missed-call' && (
                        <motion.div 
                            key="missed-call"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col h-full bg-white"
                        >
                            {/* Header */}
                            <div className="pt-14 pb-4 px-6 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 flex flex-col items-center">
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-bold text-white mb-2">JD</div>
                                <span className="text-xs text-gray-500 font-medium">John Doe</span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                                <div className="flex justify-center"><span className="text-[10px] text-gray-400 font-medium">Today {timeString}</span></div>
                                
                                {/* Missed Call System Msg */}
                                <div className="flex justify-center">
                                    <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-rose-500" />
                                        <span className="text-[11px] text-gray-500 font-medium">Missed Call</span>
                                    </div>
                                </div>

                                {/* Auto Reply */}
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="self-end bg-[#007AFF] text-white px-4 py-3 rounded-[20px] rounded-br-[4px] text-[15px] max-w-[85%] ml-auto shadow-sm leading-snug"
                                >
                                    Hi John! Sorry I missed you, I'm on a job. How can I help?
                                </motion.div>

                                {/* Client Reply */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="self-start bg-[#E9E9EB] text-black px-4 py-3 rounded-[20px] rounded-bl-[4px] text-[15px] max-w-[85%] mr-auto leading-snug"
                                >
                                    I need a quote for a boiler service in SW1.
                                </motion.div>
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-[#F5F5F7] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white"><ArrowRight className="w-4 h-4" /></div>
                                <div className="flex-1 h-9 bg-white border border-gray-200 rounded-full px-4 text-sm text-gray-400 flex items-center">iMessage</div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCENARIO 2: PAYMENT (Apple Wallet Style) */}
                    {activeTab === 'payment' && (
                        <motion.div 
                            key="payment"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col h-full bg-[#F2F2F7] relative"
                        >
                            {/* Background Wallpaper */}
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-100" />

                            {/* Payment Sheet */}
                            <motion.div 
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
                                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-12 z-10"
                            >
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                                
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-16 h-16 bg-[#0038A8] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-900/20">
                                        <span className="font-bold text-xl">TF</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#1D1D1F] mb-1">£450.00</h3>
                                    <p className="text-sm text-gray-500 font-medium">TradeFlow UK • Invoice #1024</p>
                                </div>

                                <div className="bg-[#F9FAFB] rounded-xl p-4 mb-8 border border-gray-100">
                                    <div className="flex justify-between py-2 border-b border-gray-200/60">
                                        <span className="text-xs text-gray-500 font-medium">Pay with</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-4 bg-black rounded-sm" />
                                            <span className="text-xs font-semibold text-[#1D1D1F]">Apple Pay</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between py-2 pt-3">
                                        <span className="text-xs text-gray-500 font-medium">Card</span>
                                        <span className="text-xs font-semibold text-[#1D1D1F]">•••• 4242</span>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
                                    <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center text-black text-[8px] font-bold"></div>
                                    Pay with Face ID
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SCENARIO 3: REVIEW (iOS Lock Screen) */}
                    {activeTab === 'review' && (
                        <motion.div 
                            key="review"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col"
                        >
                            {/* Wallpaper */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#7c3aed_0%,_#2563eb_50%,_#000000_100%)]" />
                            
                            {/* Time (Live London Time) */}
                            <div className="mt-20 text-center z-10">
                                <div className="text-7xl font-semibold text-white tracking-tight font-[system-ui]">
                                    {timeString}
                                </div>
                                <div className="text-lg font-medium text-white/90 mt-1">
                                    {dateString}
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="mt-8 px-4 space-y-2 z-10">
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white/80 backdrop-blur-xl rounded-[18px] p-4 shadow-lg"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-[#0038A8] rounded-md flex items-center justify-center text-white text-[10px] font-bold">TF</div>
                                            <span className="text-[13px] font-semibold text-[#1D1D1F] uppercase tracking-wide">TRADEFLOW</span>
                                        </div>
                                        <span className="text-[11px] text-[#1D1D1F]/60">now</span>
                                    </div>
                                    <h4 className="text-[15px] font-bold text-[#1D1D1F] mb-1">New 5-Star Review!</h4>
                                    <p className="text-[13px] text-[#1D1D1F]/80 leading-snug">
                                        "Absolutely brilliant service. Arrived on time and fixed the issue immediately."
                                    </p>
                                </motion.div>

                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white/60 backdrop-blur-md rounded-[18px] p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center text-white"><Phone className="w-3 h-3" /></div>
                                        <span className="text-[13px] font-semibold text-[#1D1D1F]">Phone</span>
                                    </div>
                                    <p className="text-[13px] text-[#1D1D1F]/80">Missed Call: John Doe</p>
                                </motion.div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="mt-auto mb-8 px-12 flex justify-between items-center z-10">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                                    <Phone className="w-6 h-6" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Home Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black rounded-full z-50" />
        </div>
      </div>
    </div>
  );
};