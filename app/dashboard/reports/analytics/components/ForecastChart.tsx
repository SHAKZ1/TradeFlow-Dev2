'use client';

import { Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, ReferenceDot } from 'recharts';
import { TrendingUp, Target, AlertTriangle, Sliders } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const formatCurrency = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

// --- ADDED PROPS INTERFACE ---
interface ForecastChartProps {
    data: any;
    onToggleSim: () => void;
    isSimActive: boolean;
    onDrillDown?: (date: string) => void;
}

export default function ForecastChart({ data, onToggleSim, isSimActive, onDrillDown }: ForecastChartProps) {
  const chartData = data.data;
  const hasFutureData = chartData.some((d: any) => d.isFuture);
  const todayIndex = chartData.findIndex((d: any) => d.isFuture) - 1;
  const todayLabel = todayIndex >= 0 ? chartData[todayIndex]?.date : null;
  
  const targetFinish = chartData[chartData.length - 1]?.target || 0;
  const simulatedFinish = chartData[chartData.length - 1]?.simulated || 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSimActive ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                        {isSimActive ? <Sliders className="w-4 h-4 text-amber-600" /> : <TrendingUp className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                        {isSimActive ? 'Simulated Trajectory' : 'Revenue Trajectory'}
                    </h3>
                    <InfoTooltip text={isSimActive ? "Projected revenue based on your custom simulation parameters." : "Target is a static line calculated from your all-time historical daily average prior to this period."} />
                    
                    {/* SIMULATOR BUTTON */}
                    <button 
                        onClick={onToggleSim}
                        className={`flex items-center gap-1.5 px-3 py-1 ml-3 rounded-full text-[10px] font-bold transition-all border-none outline-none cursor-pointer shadow-sm
                            ${isSimActive ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Sliders className="w-3 h-3" /> Simulator
                    </button>
                </div>
                {data.isCalibrating ? (
                    <div className="flex items-center gap-1.5 text-amber-600 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Calibrating Target (Needs 14 Days Data)</span>
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest pl-1">
                        {isSimActive ? "Visualizing potential future outcomes." : "Actual vs Historical Baseline"}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5 items-end">
                <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Banked</span><div className="w-6 h-1 bg-emerald-500 rounded-full" /></div>
                {hasFutureData && !data.isCalibrating && (
                    isSimActive ? (
                        <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Simulated</span><div className="w-6 h-0 border-b-2 border-amber-500 border-dashed" /></div>
                    ) : (
                        <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Target</span><div className="w-6 h-0 border-b-2 border-indigo-500 border-dashed" /></div>
                    )
                )}
            </div>
        </div>

        <div className="flex-1 w-full min-h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} onClick={(e) => { if (e && e.activeLabel && onDrillDown) onDrillDown(String(e.activeLabel)); }} style={{ cursor: 'pointer' }}>
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} tickFormatter={(val) => `£${val/1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)' }} itemStyle={{ fontSize: '11px', fontWeight: 600 }} labelStyle={{ color: '#6B7280', fontSize: '10px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }} formatter={(value: any, name: any) =>[formatCurrency(value), String(name)]} />
                    
                    {hasFutureData && todayLabel && <ReferenceLine x={todayLabel} stroke="#9CA3AF" strokeDasharray="3 3" />}
                    
                    <Area type="monotone" dataKey="actual" name="Banked" stroke="#10B981" strokeWidth={3} fill="url(#colorActual)" />
                    
                    {hasFutureData && !data.isCalibrating && (
                        isSimActive ? (
                            <Line type="monotone" dataKey="simulated" name="Simulated" stroke="#F59E0B" strokeWidth={3} strokeDasharray="4 4" dot={false} connectNulls animationDuration={500} />
                        ) : (
                            <Line type="monotone" dataKey="target" name="Target" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                        )
                    )}
                    
                    <ReferenceDot x={chartData.find((d:any) => d.isToday)?.date} y={chartData.find((d:any) => d.isToday)?.actual} r={5} fill="#10B981" stroke="#fff" strokeWidth={2} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>

        {hasFutureData && !data.isCalibrating && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center relative z-10">
                {isSimActive ? (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><Target className="w-3.5 h-3.5" /></div>
                            <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Original Target</p><p className="text-sm font-bold text-gray-500">{formatCurrency(targetFinish)}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Sliders className="w-3.5 h-3.5" /></div>
                            <div><p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Simulated Finish</p><p className="text-sm font-bold text-amber-600">{formatCurrency(simulatedFinish)}</p></div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600"><Target className="w-3.5 h-3.5" /></div>
                        <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Target Finish</p><p className="text-sm font-bold text-gray-900">{formatCurrency(targetFinish)}</p></div>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}