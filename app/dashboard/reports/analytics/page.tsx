'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, DollarSign, Activity, Target, CheckCircle2 } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import MapWrapper from './components/MapWrapper';
import ForecastChart from './components/ForecastChart';
import SourceMatrix from './components/SourceMatrix';
import PipelineFunnel from './components/PipelineFunnel';
import ActionListCard from './components/ActionListCard';
import CashFlowChart from './components/CashFlowChart';
import { DateRangePicker, DateRange } from './components/DateRangePicker';
import SubcontractorCard from './components/SubcontractorCard';
import XRaySheet from './components/XRaySheet';
import SimulationPanel, { SimulationState } from './components/SimulationPanel';
import { motion } from 'framer-motion';

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

function SuperCard({ title, primaryValue, primaryLabel, secondaryValue, secondaryLabel, icon: Icon, color, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color.bg}`}><Icon className={`w-5 h-5 ${color.text}`} /></div>
                <span className="text-sm font-bold text-gray-900">{title}</span>
            </div>
        </div>
        <div className="flex justify-between items-end">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{primaryLabel}</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{primaryValue}</h3>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{secondaryLabel}</p>
                <p className={`text-lg font-bold tabular-nums ${color.text}`}>{secondaryValue}</p>
            </div>
        </div>
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const[theaterMode, setTheaterMode] = useState(false);
  
  // Simulator State
  const [showSim, setShowSim] = useState(false);
  const [simState, setSimState] = useState<SimulationState>({ volume: 0, price: 0, winRate: 0 });
  
  // X-Ray State
  const[xRayOpen, setXRayOpen] = useState(false);
  const [xRayTitle, setXRayTitle] = useState('');
  const[xRayLeads, setXRayLeads] = useState<any[]>([]);
  
  const[dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()), label: 'This Month' });

  useEffect(() => {
    setLoading(true);
    const query = `?from=${format(dateRange.from, 'yyyy-MM-dd')}&to=${format(dateRange.to, 'yyyy-MM-dd')}`;
    fetch(`/api/reports/sledgehammer${query}`).then(res => res.json()).then(json => { setData(json); setLoading(false); });
  }, [dateRange]);

  // --- X-RAY DRILL DOWN (FIXED DATE PARSING) ---
  const handleDrillDown = (type: 'date' | 'source', value: string) => {
      if (!data || !data.rawLeads) return;
      
      let filtered =[];
      if (type === 'date') {
          filtered = data.rawLeads.filter((l: any) => {
              if (!l.createdAt) return false;
              const d = new Date(l.createdAt);
              if (isNaN(d.getTime())) return false;
              return format(d, 'd MMM') === value || format(d, 'yyyy-MM-dd') === value;
          });
          setXRayTitle(`Activity on ${value}`);
      } else {
          filtered = data.rawLeads.filter((l: any) => l.source === value);
          setXRayTitle(`Source: ${value}`);
      }

      // Map to the format XRaySheet expects
      const mappedLeads = filtered.map((l: any) => ({
          id: l.id,
          name: l.name,
          value: l.value,
          status: l.stage,
          date: l.createdAt,
          source: l.source,
          contactId: l.contactId
      }));

      setXRayLeads(mappedLeads);
      setXRayOpen(true);
  };

  // --- SIMULATOR LOGIC ---
  const simulatedForecast = useMemo(() => {
      if (!data || !data.forecast || !data.forecast.data) return[];
      const baseData = data.forecast.data;
      
      if (simState.volume === 0 && simState.price === 0 && simState.winRate === 0) return baseData;

      const volMod = 1 + (simState.volume / 100);
      const priceMod = 1 + (simState.price / 100);
      const winMod = 1 + (simState.winRate / 100); 
      const totalMod = volMod * priceMod * winMod;

      const lastActualIndex = baseData.findLastIndex((p: any) => !p.isFuture);
      const currentBase = baseData[lastActualIndex]?.actual || 0;

      return baseData.map((point: any, index: number) => {
          if (index === lastActualIndex) return { ...point, simulated: point.actual };
          if (!point.isFuture) return point;
          const projectedGain = point.target - currentBase;
          return { ...point, simulated: Math.round(currentBase + (projectedGain * totalMod)) };
      });
  }, [data, simState]);

  if (loading || !data) return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#F9FAFB]">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calculating Intelligence...</p>
      </div>
  );

  const { financials, mapData, cashFlow, sources, funnel, actionable, subcontractorStats } = data;
  
  // Get the final projected revenue (either simulated or standard target)
  const projectedRevenue = simulatedForecast.length > 0 
    ? (simulatedForecast[simulatedForecast.length - 1]?.simulated || simulatedForecast[simulatedForecast.length - 1]?.target || 0)
    : 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-8 pb-20 max-w-[1600px] mx-auto relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Command Center</h1>
            <p className="text-sm text-gray-500 font-medium mt-2">Real-time financial telemetry & geospatial intelligence.</p>
        </div>
        <div className="flex gap-3">
            {/* Simulator button removed from here, now only lives in the chart */}
            <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <SimulationPanel isOpen={showSim} onClose={() => setShowSim(false)} onSimulate={setSimState} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SuperCard title="Financial Health" primaryValue={formatCurrency(financials.revenue)} primaryLabel="Net Revenue" secondaryValue={formatCurrency(financials.grossProfit)} secondaryLabel="Gross Profit" icon={DollarSign} color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} delay={0.1} />
            <SuperCard title="Projection" primaryValue={formatCurrency(projectedRevenue)} primaryLabel={showSim ? "Simulated Finish" : "Target Finish"} secondaryValue={formatCurrency(financials.cost)} secondaryLabel="Total Costs" icon={Target} color={{ bg: showSim ? 'bg-amber-50' : 'bg-purple-50', text: showSim ? 'text-amber-600' : 'text-purple-600' }} delay={0.2} />
            <SuperCard title="Performance" primaryValue={`${financials.conversionRate.toFixed(1)}%`} primaryLabel="Win Rate" secondaryValue={formatCurrency(financials.avgJobValue)} secondaryLabel="Avg Ticket" icon={Activity} color={{ bg: 'bg-blue-50', text: 'text-blue-600' }} delay={0.3} />
            <SuperCard title="Throughput" primaryValue={financials.completedJobs} primaryLabel="Completed" secondaryValue={financials.lostLeads} secondaryLabel="Lost" icon={CheckCircle2} color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[450px] mb-8">
        <div className="lg:col-span-5 h-[400px] lg:h-full">
            <MapWrapper data={mapData} isTheaterMode={theaterMode} toggleTheaterMode={() => setTheaterMode(!theaterMode)} />
        </div>
        <div className="lg:col-span-7 h-[400px] lg:h-full">
            <ForecastChart 
                data={{ isCalibrating: data.forecast.isCalibrating, data: simulatedForecast }} 
                onToggleSim={() => setShowSim(!showSim)}
                isSimActive={showSim}
                onDrillDown={(date) => handleDrillDown('date', date)} 
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2"><CashFlowChart data={cashFlow} /></div>
          <div className="lg:col-span-1 flex flex-col gap-6">
              <ActionListCard type="invoice" items={actionable.unpaidInvoices} />
              <ActionListCard type="deposit" items={actionable.unpaidDeposits} />
              <ActionListCard type="review" items={actionable.reviews} />
          </div>
      </div>

      <div className="flex flex-col gap-8">
          <div className="w-full h-auto min-h-[350px]"><PipelineFunnel data={funnel} /></div>
          {sources.length > 0 && <div className="w-full h-auto min-h-[300px]"><SourceMatrix data={sources} onDrillDown={(source) => handleDrillDown('source', source)} /></div>}
          {subcontractorStats.length > 0 && <div className="w-full h-auto min-h-[300px]"><SubcontractorCard data={subcontractorStats} /></div>}
      </div>

      <XRaySheet isOpen={xRayOpen} onClose={() => setXRayOpen(false)} title={xRayTitle} leads={xRayLeads} />
    </div>
  );
}