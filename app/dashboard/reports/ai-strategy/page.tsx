'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Sparkles, TrendingUp, Globe, CheckCircle2, AlertTriangle, 
  RefreshCw, BrainCircuit, Target, ShieldAlert, ArrowRight,
  Search, Star, Zap, Layout
} from 'lucide-react';

// --- TYPES ---
// (Matches the Zod Schema)
interface AiReport {
  executiveSummary: { title: string; content: string; status: string };
  performance: { analysis: string; bottleneck: string; focusTip: { title: string; content: string }; chartData: any[] };
  seoAnalysis: { overview: string; competitorComparison: any[]; actionableAdvice: string };
  reputation: { overview: string; platforms: any[]; strategy: string };
  actionPlan: any[];
  finalNote: string;
}

// --- COMPONENTS ---

function SectionHeader({ title, icon: Icon }: { title: string, icon: any }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
        </div>
    );
}

function LoadingState() {
    // ... (Keep existing loading state)
    return <div className="p-20 text-center">Thinking...</div>;
}

export default function AiStrategyPage() {
  const [report, setReport] = useState<AiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch Logic (Same as before)
  useEffect(() => {
    fetch('/api/ai/generate')
        .then(res => res.json())
        .then(data => {
            if (data.report) {
                // Handle legacy vs new format
                if (data.report.executiveSummary.title) {
                    setReport(data.report);
                } else {
                    // If legacy, maybe trigger regen or show legacy view
                    // For now, we assume new format
                }
            }
            setLoading(false);
        })
        .catch(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
      setGenerating(true);
      try {
          const res = await fetch('/api/ai/generate', { method: 'POST' });
          const data = await res.json();
          if (data.success) setReport(data.report);
      } catch (e) { console.error(e); } 
      finally { setGenerating(false); }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 text-xs">Initializing Cortex...</div>;
  if (generating) return <LoadingState />;
  if (!report) return (
      <div className="h-[70vh] flex flex-col items-center justify-center">
          <button onClick={handleGenerate} className="px-8 py-4 bg-black text-white rounded-2xl font-bold">Generate Strategy</button>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto pt-8 px-4 md:px-8 pb-24 space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Strategic OS</h1>
                <p className="text-gray-500 mt-2 font-medium">Live Intelligence Briefing</p>
            </div>
            <button onClick={handleGenerate} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
        </div>

        {/* 1. EXECUTIVE SUMMARY */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-black rounded-[32px] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        report.executiveSummary.status === 'Critical' ? 'bg-red-500/20 border-red-500/50 text-red-300' : 
                        report.executiveSummary.status === 'At Risk' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 
                        'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    }`}>
                        {report.executiveSummary.status}
                    </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{report.executiveSummary.title}</h2>
                <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">{report.executiveSummary.content}</p>
            </div>
        </motion.div>

        {/* 2. PERFORMANCE & FINANCIALS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm">
                <SectionHeader title="Performance" icon={TrendingUp} />
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{report.performance.analysis}</p>
                
                {/* CHART */}
                <div className="h-48 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.performance.chartData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={40}>
                                {report.performance.chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#94A3B8' : index === 1 ? '#4F46E5' : '#10B981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Focus Tip
                    </h4>
                    <p className="text-sm font-bold text-gray-900 mb-1">{report.performance.focusTip.title}</p>
                    <p className="text-xs text-gray-600">{report.performance.focusTip.content}</p>
                </div>
            </motion.div>

            {/* 3. SEO & ADS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm">
                <SectionHeader title="Search Dominance" icon={Search} />
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{report.seoAnalysis.overview}</p>
                
                <div className="space-y-4 mb-6">
                    {report.seoAnalysis.competitorComparison.map((comp: any, i: number) => {
                        // Calculate relative width based on the highest score in the set
                        const maxScore = Math.max(...report.seoAnalysis.competitorComparison.map((c: any) => c.score));
                        const widthPercent = maxScore > 0 ? (comp.score / maxScore) * 100 : 0;
                        
                        return (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-500 w-32 truncate" title={comp.name}>{comp.name}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-blue-400'}`} 
                                        style={{ width: `${Math.max(widthPercent, 2)}%` }} // Min 2% visibility
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-900 w-16 text-right">{comp.score.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-600 font-medium">
                        <span className="font-bold text-gray-900">Strategy:</span> {report.seoAnalysis.actionableAdvice}
                    </p>
                </div>
            </motion.div>
        </div>

        {/* 4. REPUTATION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[32px] p-8 border border-gray-200 shadow-sm">
            <SectionHeader title="Reputation Audit" icon={Star} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {report.reputation.platforms.map((plat: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{plat.name}</span>
                        <span className="text-2xl font-bold text-gray-900">{plat.count}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                            plat.status === 'Strong' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>{plat.status}</span>
                    </div>
                ))}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{report.reputation.strategy}</p>
        </motion.div>

        {/* 5. ACTION PLAN */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                <SectionHeader title="Execution Roadmap" icon={Target} />
            </div>
            <div className="divide-y divide-gray-100">
                {report.actionPlan.map((action: any, i: number) => (
                    <div key={i} className="p-8 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {i + 1}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-1">{action.title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed mb-3">{action.description}</p>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wide">
                                    Impact: {action.impact}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>

        {/* 6. FINAL NOTE */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center py-8">
            <p className="text-lg font-medium text-gray-500 italic">"{report.finalNote}"</p>
        </motion.div>

    </div>
  );
}