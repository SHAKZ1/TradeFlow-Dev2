'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, RefreshCw, TrendingUp, Users, DollarSign, X } from 'lucide-react';

export interface SimulationState {
  volume: number;
  price: number;
  winRate: number;
}

interface SimulationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (state: SimulationState) => void;
}

export default function SimulationPanel({ isOpen, onClose, onSimulate }: SimulationPanelProps) {
  const [state, setState] = useState<SimulationState>({ volume: 0, price: 0, winRate: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
        onSimulate(state);
    }, 50);
    return () => clearTimeout(timer);
  }, [state, onSimulate]);

  const handleReset = () => setState({ volume: 0, price: 0, winRate: 0 });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-24 right-8 w-80 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/50 z-[50] overflow-hidden"
        >
            {/* HEADER */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Reality Simulator</h3>
                </div>
                <div className="flex gap-1">
                    {/* FIX: Removed grey backgrounds */}
                    <button onClick={handleReset} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors border-none outline-none cursor-pointer bg-transparent">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors border-none outline-none cursor-pointer bg-transparent">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="p-6 space-y-8">
                
                {/* 1. LEAD VOLUME */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <Users className="w-3.5 h-3.5" /> Lead Volume
                        </div>
                        <span className={`text-xs font-bold ${state.volume > 0 ? 'text-emerald-600' : state.volume < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                            {state.volume > 0 ? '+' : ''}{state.volume}%
                        </span>
                    </div>
                    <input 
                        type="range" min="-50" max="100" step="5"
                        value={state.volume}
                        onChange={(e) => setState(prev => ({ ...prev, volume: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none accent-indigo-600 slider-thumb-cursor"
                    />
                </div>

                {/* 2. AVG PRICE */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <DollarSign className="w-3.5 h-3.5" /> Pricing Power
                        </div>
                        <span className={`text-xs font-bold ${state.price > 0 ? 'text-emerald-600' : state.price < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                            {state.price > 0 ? '+' : ''}{state.price}%
                        </span>
                    </div>
                    <input 
                        type="range" min="-20" max="50" step="5"
                        value={state.price}
                        onChange={(e) => setState(prev => ({ ...prev, price: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none accent-indigo-600 slider-thumb-cursor"
                    />
                </div>

                {/* 3. WIN RATE */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <TrendingUp className="w-3.5 h-3.5" /> Win Rate
                        </div>
                        <span className={`text-xs font-bold ${state.winRate > 0 ? 'text-emerald-600' : state.winRate < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                            {state.winRate > 0 ? '+' : ''}{state.winRate}%
                        </span>
                    </div>
                    <input 
                        type="range" min="-20" max="20" step="1"
                        value={state.winRate}
                        onChange={(e) => setState(prev => ({ ...prev, winRate: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none accent-indigo-600 slider-thumb-cursor"
                    />
                </div>

            </div>

            {/* FOOTER */}
            <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 text-center">
                <p className="text-[10px] text-indigo-400 font-medium">
                    Adjusting these values projects a "Ghost Line" on your revenue forecast.
                </p>
            </div>

            {/* GLOBAL STYLE FOR CURSOR */}
            <style jsx global>{`
                .slider-thumb-cursor::-webkit-slider-thumb {
                    cursor: pointer;
                }
                .slider-thumb-cursor::-moz-range-thumb {
                    cursor: pointer;
                }
            `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}