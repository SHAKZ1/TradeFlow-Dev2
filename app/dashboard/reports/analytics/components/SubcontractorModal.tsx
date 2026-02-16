'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CheckCircle2, Clock, ArrowRight, User } from 'lucide-react';

interface SubJob {
    id: string;
    title: string;
    pay: number;
    value: number;
    start: string | null;
    end: string | null;
    status: string;
}

interface SubcontractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontractor: {
      name: string;
      payout: number;
      revenue: number;
      jobs: number;
      roi: number;
      jobList: SubJob[];
  } | null;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

export default function SubcontractorModal({ isOpen, onClose, subcontractor }: SubcontractorModalProps) {
  if (!isOpen || !subcontractor) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
            {/* BACKDROP */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[10000]"
                onClick={onClose}
            />

            {/* MODAL */}
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="fixed inset-0 m-auto w-full max-w-lg h-[600px] bg-white rounded-[32px] shadow-2xl z-[10001] flex flex-col overflow-hidden border border-gray-100"
            >
                {/* HEADER */}
                <div className="p-8 border-b border-gray-50 flex justify-between items-start bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
                            {subcontractor.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{subcontractor.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                    {subcontractor.jobs} Jobs
                                </span>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {formatCurrency(subcontractor.payout)} Earned
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors border-none outline-none cursor-pointer">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* JOB LIST */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] space-y-3 custom-scrollbar">
                    {subcontractor.jobList.map((job) => {
                        const isComplete = job.status === 'job-complete' || job.status === 'previous-jobs';
                        const startDate = job.start ? new Date(job.start) : null;
                        
                        return (
                            <div key={job.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                                <div className="flex flex-col gap-1">
                                    <h4 className="text-sm font-bold text-gray-900">{job.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                        <Calendar className="w-3 h-3" />
                                        {startDate ? startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                                        
                                        {isComplete ? (
                                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">
                                                <CheckCircle2 className="w-3 h-3" /> Complete
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">
                                                <Clock className="w-3 h-3" /> Active
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(job.pay)}</p>
                                    <p className="text-[10px] text-gray-400">Job Val: {formatCurrency(job.value)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}