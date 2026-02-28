'use client';

import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

const getAiInsight = (cash: number, work: number, avgDaysToPay: number) => {
    const diff = cash - work;
    if (work === 0 && cash > 0) return { status: 'Pre-Funding', message: "Excellent. You have secured deposits before work has commenced.", color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 };
    if (diff >= 0) return { status: 'Cash Surplus', message: "Healthy flow. You are collecting payments faster than you are booking work.", color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp };
    
    // Smart Logic: If the gap is huge, but they usually get paid in 30 days, it might be normal.
    if (avgDaysToPay > 14 && Math.abs(diff) > (work * 0.5)) {
        return { status: 'Standard Lag', message: `You have ${formatCurrency(Math.abs(diff))} uncollected, but this aligns with your ${avgDaysToPay}-day average payment cycle.`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Info };
    } else if (Math.abs(diff) > (work * 0.5)) {
        return { status: 'Collection Alert', message: `Critical lag. Over 50% of booked work is unpaid. Chase invoices immediately.`, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle };
    }

    return { status: 'Uncollected Value', message: `You have ${formatCurrency(Math.abs(diff))} of work booked that hasn't hit the bank yet.`, color: 'text-amber-600', bg: 'bg-amber-50', icon: Info };
};

export default function CashFlowChart({ data }: { data: any }) {
  const [showTooltip, setShowTooltip] = useState(false);
  if (!data || !data.series || data.series.length === 0) return null;

  const lastPoint = data.series[data.series.length - 1];
  const revenue = lastPoint.revenue; 
  const cash = lastPoint.cash;       
  const netPosition = cash - revenue; 
  const isSurplus = netPosition >= 0;
  const insight = getAiInsight(cash, revenue, data.avgDaysToPay);
  const InsightIcon = insight.icon;

  return (
    <div className="flex flex-col w-full bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 relative overflow-visible">
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><Wallet className="w-4 h-4 text-emerald-600" /></div>
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">Cash Flow Chronometer</h3>
                    <div className="relative flex items-center justify-center" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                        <Info className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors cursor-help" />
                        {showTooltip && <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 text-white text-[11px] font-medium leading-relaxed p-3 rounded-xl shadow-xl z-50">Compares <strong>Work Booked</strong> (Blue) vs <strong>Cash Collected</strong> (Green).</div>}
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest pl-1">Realized vs. Unrealized</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{isSurplus ? 'Cash Surplus' : 'Uncollected Value'}</p>
                <div className={`flex items-center justify-end gap-2 ${isSurplus ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <span className="text-xl font-bold tabular-nums tracking-tight">{isSurplus ? '+' : ''}{formatCurrency(Math.abs(netPosition))}</span>
                </div>
            </div>
        </div>

        <div className={`mb-6 px-3 py-2 rounded-lg border flex items-start gap-3 ${insight.bg} ${insight.color.replace('text-', 'border-').replace('600', '200')}`}>
            <InsightIcon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.color}`} />
            <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${insight.color}`}>{insight.status}</p>
                <p className="text-xs font-medium text-gray-700 leading-snug">{insight.message}</p>
            </div>
        </div>

        <div className="w-full h-[250px] relative z-0">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} tickFormatter={(val) => `£${val/1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '11px', fontWeight: 600 }} formatter={(value: any) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" name="Work Booked" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="cash" name="Cash Banked" stroke="#10B981" strokeWidth={3} fill="url(#colorCash)" />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}