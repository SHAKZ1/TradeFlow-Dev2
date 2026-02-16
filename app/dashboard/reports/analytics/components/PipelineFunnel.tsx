'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, HelpCircle, Info, ArrowRight } from 'lucide-react';
import StageDetailModal from './StageDetailModal';

interface FunnelStage {
  id: string;
  label: string;
  count: number;
  value: number;
  color: string;
  textColor: string;
  bgColor: string;
  leads: any[];
}

interface PipelineFunnelProps {
  data?: {
    stages: FunnelStage[];
    diagnosis: string;
    bottleneck: string;
    reasoning: string;
    advice: string;
    severity: 'low' | 'medium' | 'high';
  };
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function PipelineFunnel({ data }: PipelineFunnelProps) {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<FunnelStage | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  if (!data || !data.stages) {
      return (
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 h-full flex items-center justify-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Pipeline Data...</p>
          </div>
      );
  }

  const maxCount = Math.max(...data.stages.map(s => s.count), 1);

  return (
    <>
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 h-full flex flex-col relative overflow-visible">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-12">
            <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Pipeline Velocity</h3>
                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Conversion Health & Bottlenecks</p>
            </div>
            
            {/* DIAGNOSIS CHIP (INTERACTIVE) */}
            <div 
                className="relative"
                onMouseEnter={() => setShowDiagnosis(true)}
                onMouseLeave={() => setShowDiagnosis(false)}
            >
                <div className={`flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-help transition-colors hover:bg-gray-100
                    ${data.severity === 'high' ? 'border-rose-100 bg-rose-50/50' : ''}`}>
                    
                    {/* FIX: Enforced Perfect Circle Dimensions */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${data.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {data.severity === 'high' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Diagnosis</p>
                        <p className={`text-xs font-bold ${data.severity === 'high' ? 'text-rose-700' : 'text-gray-900'}`}>{data.diagnosis}</p>
                    </div>
                    <Info className="w-4 h-4 text-gray-300 ml-2" />
                </div>

                {/* THE "WHY" TOOLTIP */}
                <AnimatePresence>
                    {showDiagnosis && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full right-0 mt-3 w-80 bg-gray-900 text-white p-5 rounded-2xl shadow-2xl z-50"
                        >
                            <div className="absolute -top-1 right-8 w-3 h-3 bg-gray-900 rotate-45" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Analysis</p>
                            <p className="text-sm font-medium leading-relaxed mb-4">{data.reasoning}</p>
                            
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Recommendation</p>
                            <p className="text-xs text-gray-300 leading-relaxed">{data.advice}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* THE FLOW CHART */}
        <div className="flex-1 flex items-center justify-between relative px-4">
            
            {/* CONNECTING LINE */}
            <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-gray-100 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                 {/* Animated Pulse Line if Healthy */}
                 {data.severity !== 'high' && (
                     <motion.div 
                        className="h-full bg-gradient-to-r from-transparent via-emerald-200 to-transparent w-1/2 opacity-50"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     />
                 )}
            </div>

            {data.stages.map((stage, index) => {
                const isHovered = hoveredStage === index;
                const isBottleneck = data.bottleneck === stage.label || (data.bottleneck === 'Quote' && stage.label === 'Quotes Sent') || (data.bottleneck === 'New Lead' && stage.label === 'New Leads');
                
                return (
                    <div key={stage.id} className="relative z-10 flex flex-col items-center group"
                         onMouseEnter={() => setHoveredStage(index)}
                         onMouseLeave={() => setHoveredStage(null)}
                         onClick={() => setSelectedStage(stage)}
                    >
                        {/* THE NODE */}
                        <motion.div 
                            layout
                            className={`relative rounded-2xl border-4 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center bg-white
                                ${isHovered ? 'w-36 h-36 shadow-xl scale-110 z-20' : 'w-28 h-28 shadow-sm'}
                                ${isBottleneck ? 'border-rose-100 ring-4 ring-rose-50 shadow-rose-100' : 'border-white'}
                            `}
                        >
                            {/* Inner Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                                ${isHovered ? 'scale-110' : ''}
                                ${stage.bgColor} ${stage.textColor}
                            `}>
                                <span className="font-bold text-lg">{index + 1}</span>
                            </div>

                            {/* Label */}
                            <p className="text-[11px] font-bold text-gray-900 text-center px-2 leading-tight">{stage.label}</p>
                            
                            {/* Count */}
                            <p className="text-[10px] font-medium text-gray-500 mt-1">{stage.count} Leads</p>

                            {/* Value (Only on Hover) */}
                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="absolute -bottom-8 bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-lg whitespace-nowrap"
                                    >
                                        {formatCurrency(stage.value)}
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* BOTTLENECK INDICATOR */}
                        {isBottleneck && (
                            <div className="absolute -top-3 right-0">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>

    {/* DETAIL MODAL */}
    <StageDetailModal 
        isOpen={!!selectedStage}
        onClose={() => setSelectedStage(null)}
        stageName={selectedStage?.label || ''}
        leads={selectedStage?.leads || []}
        color={selectedStage?.color || 'bg-gray-500'}
    />
    </>
  );
}