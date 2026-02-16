'use client';

import { 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ComposedChart,
  ReferenceDot
} from 'recharts';
import { TrendingUp, Target, Zap, Sliders } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

interface ForecastChartProps {
    data: any[];
    onToggleSim: () => void;
    isSimActive: boolean;
    onDrillDown?: (date: string) => void;
}

export default function ForecastChart({ data, onToggleSim, isSimActive, onDrillDown }: ForecastChartProps) {
  // 1. Detect Time Context & Simulation State
  const hasFutureData = data.some(d => d.isFuture);
  const hasSimulation = data.some(d => d.simulated !== undefined && d.simulated !== null);
  
  // Find "Today" for the vertical line
  const todayIndex = data.findIndex(d => d.isFuture) - 1;
  const todayLabel = todayIndex >= 0 ? data[todayIndex]?.date : null;

  // Get Final Values for Footer
  const lastPoint = data[data.length - 1];
  const targetFinish = lastPoint?.target || 0;
  const optimisticFinish = lastPoint?.optimistic || 0;
  const simulatedFinish = lastPoint?.simulated || 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasSimulation ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                        {hasSimulation ? (
                            <Sliders className="w-4 h-4 text-amber-600" />
                        ) : (
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                        )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                        {hasSimulation ? 'Simulated Trajectory' : (hasFutureData ? 'Revenue Forecast' : 'Revenue History')}
                    </h3>
                    <InfoTooltip text={hasSimulation 
                        ? "Projected revenue based on your custom simulation parameters (Volume, Price, Win Rate)."
                        : "Target = Historical Win Rate applied to open pipeline. Optimistic = Target + 50% of potential upside."} 
                    />

                    {/* SIMULATOR BUTTON */}
                    <button 
                        onClick={onToggleSim}
                        className={`flex items-center gap-1.5 px-3 py-1 ml-3 rounded-full text-[10px] font-bold transition-all border-none outline-none cursor-pointer shadow-sm
                            ${isSimActive ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Sliders className="w-3 h-3" /> Simulator
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 font-medium max-w-xs leading-relaxed pl-1">
                    {hasSimulation 
                        ? "Visualizing potential future outcomes."
                        : (hasFutureData ? "AI Projection based on pipeline velocity." : "Historical revenue performance.")}
                </p>
            </div>
            
            {/* DYNAMIC LEGEND */}
            <div className="flex flex-col gap-1.5 items-end">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Banked</span>
                    <div className="w-6 h-1 bg-emerald-500 rounded-full" />
                </div>
                
                {hasFutureData && (
                    <>
                        {hasSimulation ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Simulated</span>
                                <div className="w-6 h-0 border-b-2 border-amber-500 border-dashed" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Target</span>
                                    <div className="w-6 h-0 border-b-2 border-indigo-500 border-dashed" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-purple-500 uppercase tracking-wider">Optimistic</span>
                                    <div className="w-6 h-0 border-b-2 border-purple-500 border-dotted" />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* CHART */}
        <div className="flex-1 w-full min-h-[250px] relative z-10">
            {data.length === 0 || data.every(d => d.actual === 0 && d.forecast === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-400">No financial data for this period</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                    data={data} 
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    onClick={(e) => {
                        // FIX: Explicitly cast activeLabel to string
                        if (e && e.activeLabel && onDrillDown) {
                            onDrillDown(String(e.activeLabel));
                        }
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    
                    <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} 
                        tickFormatter={(val) => `£${val/1000}k`}
                    />
                    
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                        labelStyle={{ color: '#6B7280', fontSize: '10px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}
                        // FIX: Explicitly cast name to string to satisfy strict types
                        formatter={(value: any, name: any) => [formatCurrency(value), String(name)]}
                    />

                    {/* TODAY LINE */}
                    {hasFutureData && todayLabel && (
                        <ReferenceLine x={todayLabel} stroke="#9CA3AF" strokeDasharray="3 3" />
                    )}

                    {/* 1. ACTUAL (Solid Area) */}
                    <Area 
                        type="monotone" 
                        dataKey="actual" 
                        name="Banked"
                        stroke="#10B981" 
                        strokeWidth={3} 
                        fill="url(#colorActual)" 
                    />
                    
                    {/* 2. TARGET (Standard Forecast) */}
                    {hasFutureData && (
                        <Line 
                            type="monotone" 
                            dataKey="target" 
                            name="Target"
                            stroke={hasSimulation ? "#E5E7EB" : "#6366f1"} // Fade out if simulating
                            strokeWidth={2} 
                            strokeDasharray="5 5"
                            dot={false}
                            connectNulls 
                        />
                    )}

                    {/* 3. OPTIMISTIC (Dotted Line) */}
                    {hasFutureData && !hasSimulation && (
                        <Line 
                            type="monotone" 
                            dataKey="optimistic" 
                            name="Optimistic"
                            stroke="#a855f7" 
                            strokeWidth={2} 
                            strokeDasharray="2 2"
                            dot={false}
                            connectNulls 
                        />
                    )}

                    {/* 4. SIMULATED (The Ghost Line) */}
                    {hasFutureData && hasSimulation && (
                        <Line 
                            type="monotone" 
                            dataKey="simulated" 
                            name="Simulated"
                            stroke="#F59E0B" 
                            strokeWidth={3} 
                            strokeDasharray="4 4"
                            dot={false}
                            connectNulls 
                            animationDuration={500}
                        />
                    )}

                    {/* PULSING DOT AT TODAY */}
                    <ReferenceDot 
                        x={data.find(d => !d.isFuture)?.date} 
                        y={data.find(d => !d.isFuture)?.actual} 
                        r={5} 
                        fill="#10B981" 
                        stroke="#fff" 
                        strokeWidth={2}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        )}
        </div>

        {/* FOOTER STATS */}
        {hasFutureData && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center relative z-10">
                {hasSimulation ? (
                    // SIMULATION FOOTER
                    <>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><Target className="w-3.5 h-3.5" /></div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Original Target</p>
                                <p className="text-sm font-bold text-gray-500">{formatCurrency(targetFinish)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Sliders className="w-3.5 h-3.5" /></div>
                            <div>
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Simulated Finish</p>
                                <p className="text-sm font-bold text-amber-600">{formatCurrency(simulatedFinish)}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    // STANDARD FOOTER
                    <>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Target className="w-3.5 h-3.5" /></div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Target Finish</p>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(targetFinish)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600"><Zap className="w-3.5 h-3.5" /></div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Optimistic Finish</p>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(optimisticFinish)}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}
    </div>
  );
}