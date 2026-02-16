'use client';

import { useState, useEffect, FC } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { Calculator, TrendingUp, AlertCircle, ArrowRight, DollarSign, PhoneMissed, Target, Briefcase } from 'lucide-react';

export const RoiCalculator: FC = () => {
    // Default values representing a typical busy tradesperson
    const [missedCalls, setMissedCalls] = useState<number>(12);
    const [closeRate, setCloseRate] = useState<number>(35);
    const [avgJobValue, setAvgJobValue] = useState<number>(450);
    
    const [monthlyLoss, setMonthlyLoss] = useState(0);
    const [yearlyLoss, setYearlyLoss] = useState(0);

    // Spring physics for the "Apple Wallet" rolling number effect
    const springValue = useSpring(0, { stiffness: 45, damping: 15, mass: 1 });
    const displayValue = useTransform(springValue, (current) => Math.round(current).toLocaleString());

    useEffect(() => {
        const monthly = (missedCalls * (closeRate / 100)) * avgJobValue;
        setMonthlyLoss(monthly);
        setYearlyLoss(monthly * 12);
        springValue.set(monthly);
    }, [missedCalls, closeRate, avgJobValue, springValue]);

    return (
        <div className="bg-white rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100 max-w-5xl mx-auto flex flex-col md:flex-row">
            
            {/* LEFT: CONTROL CENTER (INPUTS) */}
            <div className="p-8 md:p-12 flex-1 bg-[#F5F5F7]">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-[#1D1D1F]">
                        <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1D1D1F]">Revenue Leakage Audit</h3>
                        <p className="text-xs text-gray-500 font-medium">Adjust to match your current reality.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* SLIDER 1: MISSED CALLS */}
                    <div className="group">
                        <div className="flex justify-between mb-3 items-end">
                            <div className="flex items-center gap-2">
                                <PhoneMissed className="w-4 h-4 text-rose-500" />
                                <label className="text-sm font-semibold text-[#1D1D1F]">Unanswered Leads / Month</label>
                            </div>
                            <span className="text-lg font-bold text-[#1D1D1F] bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 tabular-nums">
                                {missedCalls}
                            </span>
                        </div>
                        <input 
                            type="range" min="0" max="50" step="1"
                            value={missedCalls}
                            onChange={(e) => setMissedCalls(Number(e.target.value))}
                            className="w-full h-6 bg-white rounded-full appearance-none cursor-pointer border border-gray-200 shadow-inner slider-thumb-ios"
                            style={{
                                background: `linear-gradient(to right, #FF3B30 0%, #FF3B30 ${(missedCalls / 50) * 100}%, #FFFFFF ${(missedCalls / 50) * 100}%, #FFFFFF 100%)`
                            }}
                        />
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                            Calls you miss while driving, working, or sleeping.
                        </p>
                    </div>

                    {/* SLIDER 2: CLOSE RATE */}
                    <div className="group">
                        <div className="flex justify-between mb-3 items-end">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-500" />
                                <label className="text-sm font-semibold text-[#1D1D1F]">Conversion Rate</label>
                            </div>
                            <span className="text-lg font-bold text-[#1D1D1F] bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 tabular-nums">
                                {closeRate}%
                            </span>
                        </div>
                        <input 
                            type="range" min="0" max="100" step="5"
                            value={closeRate}
                            onChange={(e) => setCloseRate(Number(e.target.value))}
                            className="w-full h-6 bg-white rounded-full appearance-none cursor-pointer border border-gray-200 shadow-inner slider-thumb-ios"
                            style={{
                                background: `linear-gradient(to right, #007AFF 0%, #007AFF ${(closeRate / 100) * 100}%, #FFFFFF ${(closeRate / 100) * 100}%, #FFFFFF 100%)`
                            }}
                        />
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                            Percentage of leads that turn into paid jobs.
                        </p>
                    </div>

                    {/* SLIDER 3: JOB VALUE */}
                    <div className="group">
                        <div className="flex justify-between mb-3 items-end">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-emerald-500" />
                                <label className="text-sm font-semibold text-[#1D1D1F]">Average Job Value</label>
                            </div>
                            <span className="text-lg font-bold text-[#1D1D1F] bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 tabular-nums">
                                £{avgJobValue}
                            </span>
                        </div>
                        <input 
                            type="range" min="50" max="2000" step="50"
                            value={avgJobValue}
                            onChange={(e) => setAvgJobValue(Number(e.target.value))}
                            className="w-full h-6 bg-white rounded-full appearance-none cursor-pointer border border-gray-200 shadow-inner slider-thumb-ios"
                            style={{
                                background: `linear-gradient(to right, #34C759 0%, #34C759 ${(avgJobValue / 2000) * 100}%, #FFFFFF ${(avgJobValue / 2000) * 100}%, #FFFFFF 100%)`
                            }}
                        />
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                            Your typical invoice amount for a standard job.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT: THE WALLET (OUTPUT) */}
            <div className="p-8 md:p-12 flex-1 bg-white flex flex-col justify-center relative overflow-hidden">
                {/* Background Mesh */}
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_#F5F5F7_0%,_transparent_40%)]" />
                
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 mb-6">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Revenue At Risk</span>
                    </div>

                    <p className="text-sm font-medium text-gray-500 mb-2">
                        You are currently leaving this much on the table <br/> <span className="text-gray-900 font-bold">every single month:</span>
                    </p>

                    <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-4xl md:text-5xl font-bold text-[#1D1D1F] tracking-tighter">£</span>
                        <motion.span className="text-7xl md:text-8xl font-bold text-[#1D1D1F] tracking-tighter tabular-nums">
                            {displayValue}
                        </motion.span>
                    </div>

                    <div className="p-6 bg-[#1D1D1F] rounded-2xl text-white shadow-xl shadow-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Annual Impact</span>
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold tracking-tight">
                            £{yearlyLoss.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                            This is the cost of "being too busy" to answer the phone. <br/>
                            TradeFlow captures this revenue automatically.
                        </p>
                    </div>
                </div>
            </div>

            {/* GLOBAL STYLES FOR SLIDERS */}
            <style jsx global>{`
                .slider-thumb-ios::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #FFFFFF;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
                    cursor: pointer;
                    transition: transform 0.1s;
                    margin-top: 0px; /* Center thumb */
                }
                .slider-thumb-ios::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                }
                .slider-thumb-ios::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #FFFFFF;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
                    cursor: pointer;
                    border: none;
                }
            `}</style>
        </div>
    );
};