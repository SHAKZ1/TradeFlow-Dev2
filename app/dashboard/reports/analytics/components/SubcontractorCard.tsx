'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ArrowRight } from 'lucide-react';
import SubcontractorModal from './SubcontractorModal';

interface SubJob {
    id: string;
    title: string;
    pay: number;
    value: number;
    start: string | null;
    end: string | null;
    status: string;
}

interface Subcontractor {
  name: string;
  payout: number;
  revenue: number;
  jobs: number;
  roi: number;
  jobList: SubJob[];
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function SubcontractorCard({ data }: { data: Subcontractor[] }) {
  const [selectedSub, setSelectedSub] = useState<Subcontractor | null>(null);

  return (
    <>
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 h-full flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Subcontractor Scorecard</h3>
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest pl-1">
                    Performance & ROI
                </p>
            </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <Users className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400">No subcontractor data</p>
                </div>
            ) : (
                data.map((sub, i) => (
                    <div 
                        key={sub.name} 
                        onClick={() => setSelectedSub(sub)}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-500 shadow-sm border border-gray-100 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                {sub.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{sub.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                    {sub.jobs} {sub.jobs === 1 ? 'Job' : 'Jobs'} • {formatCurrency(sub.payout)} Earned
                                </p>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-emerald-600">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs font-bold">{(sub.roi || 0).toFixed(0)}% ROI</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">Rev: {formatCurrency(sub.revenue)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>

    <SubcontractorModal 
        isOpen={!!selectedSub} 
        onClose={() => setSelectedSub(null)} 
        subcontractor={selectedSub} 
    />
    </>
  );
}