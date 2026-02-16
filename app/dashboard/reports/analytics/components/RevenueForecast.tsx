'use client';

import { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot 
} from 'recharts';
import { TrendingUp, Calendar, Target } from 'lucide-react';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isAfter, getDaysInMonth, getDate 
} from 'date-fns';
import { Lead } from '../../../data';

interface RevenueForecastProps {
  leads: Lead[];
}

// --- HELPER: CURRENCY (Fixed Types) ---
const formatCurrency = (value: number | string | undefined | null) => {
  const num = Number(value);
  if (isNaN(num)) return '£0';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(num);
};

export default function RevenueForecast({ leads }: RevenueForecastProps) {
  
  // --- THE CRYSTAL BALL LOGIC ---
  const forecast = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = getDaysInMonth(now);
    const currentDay = getDate(now);

    // 1. Filter Leads for This Month (Won Jobs Only)
    const monthLeads = leads.filter(l => {
        const d = new Date(l.createdAt); 
        return d >= monthStart && d <= monthEnd && (l.status === 'job-complete' || l.status === 'previous-jobs');
    });

    // 2. Build Daily Cumulative Data
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let cumulativeRevenue = 0;
    
    const chartData = days.map(day => {
        const isFuture = isAfter(day, now);
        
        // Add revenue for this day
        const dayRevenue = monthLeads
            .filter(l => isSameDay(new Date(l.createdAt), day))
            .reduce((sum, l) => sum + l.value, 0);
        
        if (!isFuture) {
            cumulativeRevenue += dayRevenue;
        }

        return {
            date: format(day, 'd MMM'),
            rawDate: day,
            actual: isFuture ? null : cumulativeRevenue,
            projected: null as number | null, 
            isFuture
        };
    });

    // 3. Calculate Velocity (Avg Daily Revenue)
    const daysPassed = Math.max(currentDay, 1);
    const dailyVelocity = cumulativeRevenue / daysPassed;
    
    // 4. Project the Future
    let projectedTotal = cumulativeRevenue;
    
    const finalChartData = chartData.map(point => {
        if (point.isFuture) {
            projectedTotal += dailyVelocity;
            return { ...point, projected: Math.round(projectedTotal) };
        } else if (isSameDay(point.rawDate, now)) {
            return { ...point, projected: cumulativeRevenue };
        }
        return point;
    });

    const projectedFinish = Math.round(cumulativeRevenue + (dailyVelocity * (daysInMonth - currentDay)));

    return {
        chartData: finalChartData,
        currentRevenue: cumulativeRevenue,
        projectedFinish,
    };
  }, [leads]);

  return (
    <div className="flex flex-col h-full">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <Target className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Revenue Forecast</h3>
                </div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest pl-1">AI Projection • End of Month</p>
            </div>

            {/* BIG NUMBERS */}
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Current</span>
                    <span className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight">
                        {formatCurrency(forecast.currentRevenue)}
                    </span>
                </div>
                
                {/* ANIMATED ARROW */}
                <div className="h-px w-12 bg-gray-200 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-gray-300 rotate-45" />
                </div>

                <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">Projected</span>
                    <span className="text-3xl font-bold text-indigo-600 tabular-nums tracking-tight">
                        {formatCurrency(forecast.projectedFinish)}
                    </span>
                </div>
            </div>
        </div>

        {/* CHART */}
        <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                        interval={6}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                        tickFormatter={(value) => `£${value/1000}k`}
                    />
                    
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        // FIXED: Cast value to any to satisfy Recharts types
                        formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                    />

                    {/* ACTUAL REVENUE (Solid Line) */}
                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorActual)" 
                    />

                    {/* PROJECTED REVENUE (Dashed Line) */}
                    <Area 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        fillOpacity={1} 
                        fill="url(#colorProjected)" 
                    />

                    {/* THE PULSING DOT AT "TODAY" */}
                    <ReferenceDot 
                        x={forecast.chartData.find(d => !d.isFuture)?.date} 
                        y={forecast.currentRevenue} 
                        r={6} 
                        fill="#10B981" 
                        stroke="#fff" 
                        strokeWidth={2}
                    >
                        <animate attributeName="r" from="6" to="10" dur="1.5s" begin="0s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="1" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
                    </ReferenceDot>
                    <ReferenceDot 
                        x={forecast.chartData.find(d => !d.isFuture)?.date} 
                        y={forecast.currentRevenue} 
                        r={6} 
                        fill="#10B981" 
                        stroke="#fff" 
                        strokeWidth={2}
                    />

                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}