'use client';

import { motion } from 'framer-motion';
import { 
  Trophy, Target, Users, ArrowRight,
  MessageCircle, ShieldCheck, Award, Mail, Facebook, Megaphone, Phone, PhoneIncoming, User, MessageSquare 
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';

interface SourceData {
  name: string;
  total: number;
  won: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  conversion: number;
  avgTicket: number;
}

// --- HELPER: Source Icons ---
const getSourceIcon = (source: string) => {
    const classes = "w-4 h-4";
    const s = source.toLowerCase();
    if (s.includes('whatsapp')) return <MessageCircle className={`${classes} text-[#25D366]`} />;
    if (s.includes('checkatrade')) return <ShieldCheck className={`${classes} text-slate-600`} />;
    if (s.includes('trustatrader')) return <Award className={`${classes} text-orange-500`} />;
    if (s.includes('sms')) return <MessageSquare className={`${classes} text-blue-500`} />;
    if (s.includes('email')) return <Mail className={`${classes} text-indigo-500`} />;
    if (s.includes('meta') || s.includes('facebook')) return <Facebook className={`${classes} text-[#1877F2]`} />;
    if (s.includes('google')) return <Megaphone className={`${classes} text-blue-600`} />;
    if (s.includes('missed')) return <Phone className={`${classes} text-red-500`} />;
    if (s.includes('phone')) return <PhoneIncoming className={`${classes} text-cyan-600`} />;
    return <User className={`${classes} text-gray-400`} />;
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function SourceMatrix({ data, onDrillDown }: { data: SourceData[], onDrillDown?: (source: string) => void }) {
  
  // Safe max calculation
  const maxProfit = data.length > 0 ? Math.max(...data.map(d => d.profit || 0), 1) : 1;

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 h-full flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Source ROI Leaderboard</h3>
                    <InfoTooltip text="Ranks lead sources by Net Profit. 'Costs' includes expenses directly linked to jobs from this source." />
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest pl-1">Ranked by Net Profit</p>
            </div>
        </div>

        {/* TABLE HEADER */}
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-4 pl-2">Source</div>
            <div className="col-span-2 text-center">Conversion</div>
            <div className="col-span-2 text-right">Revenue</div>
            <div className="col-span-2 text-right">Costs</div>
            <div className="col-span-2 text-right pr-2">Net Profit</div>
        </div>

        {/* ROWS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mt-2">
            {data.map((source, index) => {
                // Rank Styling
                let rankBadge = <span className="text-gray-400 font-mono text-xs">#{index + 1}</span>;
                if (index === 0) rankBadge = <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-[10px] font-bold">1</div>;
                if (index === 1) rankBadge = <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold">2</div>;
                if (index === 2) rankBadge = <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold">3</div>;

                // Safe Values
                const conversion = source.conversion || 0;
                const margin = source.margin || 0;
                const profit = source.profit || 0;

                return (
                    <motion.div 
                        key={source.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onDrillDown && onDrillDown(source.name)}
                        className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group relative overflow-hidden cursor-pointer"
                    >
                        {/* PROFIT BAR BACKGROUND */}
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-emerald-50/30 transition-all duration-1000"
                            style={{ width: `${(profit / maxProfit) * 100}%` }}
                        />

                        {/* 1. SOURCE */}
                        <div className="col-span-4 flex items-center gap-3 relative z-10 pl-2">
                            {rankBadge}
                            <div className="flex items-center gap-2">
                                {getSourceIcon(source.name)}
                                <div>
                                    <p className="text-sm font-bold text-gray-900 truncate">{source.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">{source.total} Leads</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. CONVERSION */}
                        <div className="col-span-2 flex justify-center relative z-10">
                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1
                                ${conversion >= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                  conversion >= 15 ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                  'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                <Target className="w-3 h-3" />
                                {conversion.toFixed(0)}%
                            </div>
                        </div>

                        {/* 3. REVENUE */}
                        <div className="col-span-2 text-right relative z-10">
                            <p className="text-xs font-bold text-gray-900">{formatCurrency(source.revenue)}</p>
                        </div>

                        {/* 4. COSTS */}
                        <div className="col-span-2 text-right relative z-10">
                            <p className="text-xs font-medium text-gray-500">{formatCurrency(source.cost)}</p>
                        </div>

                        {/* 5. PROFIT */}
                        <div className="col-span-2 text-right relative z-10 pr-2">
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(profit)}</p>
                            <p className="text-[9px] text-emerald-400 font-medium">{margin.toFixed(0)}% Margin</p>
                        </div>

                    </motion.div>
                );
            })}

            {data.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                        <Trophy className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No Source Data</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        Once you complete jobs, we will rank your most profitable lead sources here.
                    </p>
                </div>
            )}
        </div>
    </div>
  );
}