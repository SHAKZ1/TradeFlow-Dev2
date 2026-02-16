'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import InfoTooltip from './InfoTooltip'; // <--- IMPORT

// FIX: Update formatCurrency to handle potential non-number inputs safely
const formatCurrency = (value: any) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function ProfitWaterfall({ financials }: { financials: any }) {
  
  const data = [
    { name: 'Revenue', value: financials.revenue, type: 'revenue' },
    { name: 'Expenses', value: -financials.cost, type: 'expense' },
    { name: 'Net Result', value: financials.grossProfit, type: 'profit' }
  ];

  const isProfitable = financials.grossProfit >= 0;

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 h-full flex flex-col">
        
        {/* HEADER */}
         <div className="flex justify-between items-start mb-6">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    {/* FIX: w-8 h-8 rounded-full flex items-center justify-center */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProfitable ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        <Wallet className={`w-4 h-4 ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">Profit Anatomy</h3>
                    <InfoTooltip text="Visualizes how expenses eat into your revenue. Green indicates you kept the money; Red indicates a loss." />
                </div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest pl-1">
                    Revenue vs. Costs
                </p>
            </div>
            
            {/* MINI BADGE */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${isProfitable ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-[10px] font-bold uppercase">{isProfitable ? 'Profitable' : 'Loss'}</span>
            </div>
        </div>

        {/* CHART */}
        <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                        tickFormatter={(val) => `£${val/1000}k`}
                    />
                    <Tooltip 
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}
                        // FIX: Accept 'any' to satisfy Recharts strict typing
                        formatter={(value: any) => [formatCurrency(value), "Amount"]}
                    />
                    <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={2} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={60}>
                        {data.map((entry, index) => {
                            let color = '#9CA3AF'; // Default
                            
                            if (entry.type === 'revenue') color = '#4F46E5'; // Indigo
                            if (entry.type === 'expense') color = '#F43F5E'; // Rose
                            if (entry.type === 'profit') {
                                // DYNAMIC LOGIC: Green if positive, Red if negative
                                color = entry.value >= 0 ? '#10B981' : '#F43F5E';
                            }

                            return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}