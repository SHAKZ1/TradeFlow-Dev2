'use client';

import { useState, useEffect, use } from 'react';
import { Lead, LeadStatus, QuoteRecord, STAGE_CONFIG } from '../../data';
import { LeadTable } from '../components/LeadTable';
import { Modal } from '../../Modal';
import { QuoteModal, BookingModal } from '../../TriggerModals';
import { Search, RefreshCw, ArrowUpDown, ChevronLeft } from 'lucide-react';
import { CustomSortSelect } from '../components/CustomSortSelect';
import { LoadingScreen } from '../../components/LoadingScreen';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { QuoteConfirmModal } from '../../components/QuoteConfirmModal';
import { BookingConfirmModal } from '../../components/BookingConfirmModal';

export default function PipelineStagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = use(params);
  
  // Fallback to new-lead if stage is invalid, but cast to LeadStatus
  const currentStageId = (Object.keys(STAGE_CONFIG).includes(stage) ? stage : 'new-lead') as LeadStatus;
  const stageConfig = STAGE_CONFIG[currentStageId];

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'time'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [pendingActionLead, setPendingActionLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) {
        const stageLeads = data.leads.filter((l: Lead) => {
            if (currentStageId === 'lost') return l.status === 'lost';
            return l.status === currentStageId; 
        });
        setLeads(stageLeads);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [stage]);

  const handleSaveLead = async (updatedLead: Lead, closeModal: boolean = true) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (closeModal) setSelectedLead(null);
    else setSelectedLead(updatedLead);
    try {
        await fetch('/api/leads/update', { method: 'PUT', body: JSON.stringify(updatedLead) });
    } catch (error) { console.error("Save failed", error); fetchLeads(); }
  };

  const handleLostLead = async (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    setSelectedLead(null);
    try {
        await fetch('/api/leads/lost', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: leadId })
        });
    } catch (error) {
        console.error("Failed to mark lost", error);
        fetchLeads();
    }
  };

  const handleQuoteSent = (record: QuoteRecord, newValue: number) => {
    setIsQuoteModalOpen(false);
    if (pendingActionLead) {
        const updatedLead = { 
            ...pendingActionLead, 
            value: newValue, 
            quoteHistory: [...(pendingActionLead.quoteHistory || []), record] 
        };
        handleSaveLead(updatedLead, false);
    }
    setPendingActionLead(null);
  };

  const handleMoveLead = async (lead: Lead, newStatus: LeadStatus) => {
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    try {
        await fetch('/api/leads/status', {
            method: 'PUT',
            body: JSON.stringify({
                leadId: lead.id,
                newStatus: newStatus
            })
        });
    } catch (error) {
        console.error("Move failed", error);
        fetchLeads();
    }
  };

  const filteredLeads = leads.filter(l => 
    l.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  );

  const sortedLeads = filteredLeads.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'value') comparison = a.value - b.value;
    else if (sortBy === 'time') {
        const timeA = a.jobDate ? new Date(a.jobDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
        const timeB = b.jobDate ? new Date(b.jobDate).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
        comparison = timeA - timeB;
    } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);
  const leadCount = leads.length;

  return (
    <div className="h-full flex flex-col max-w-[1600px] mx-auto pt-8 px-4 md:px-8 bg-[#F9FAFB]">
      
      <AnimatePresence>
          {isLoading && <LoadingScreen />}
      </AnimatePresence>

      {/* HEADER & STATS */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
              <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 mb-3 transition-colors no-underline">
                  <ChevronLeft className="w-3 h-3" /> Back to Board
              </Link>
              
              <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">{stageConfig.label}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stageConfig.badgeBg} ${stageConfig.badgeText} border ${stageConfig.border}`}>
                      {leadCount}
                  </span>
              </div>
              
              <div className="flex items-center gap-8 mt-6">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-0.5">Total Value</span>
                      <span className="text-2xl font-bold text-[#1D1D1F] tracking-tight">£{totalValue.toLocaleString()}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-0.5">Active Jobs</span>
                      <span className={`text-2xl font-bold tracking-tight ${stageConfig.color.replace('text-', 'text-')}`}>
                          {leadCount}
                      </span>
                  </div>
              </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative group h-10 w-full md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 transition-colors group-focus-within:text-blue-600" />
                  <input 
                      type="text" 
                      placeholder="Search leads..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 h-full w-full bg-white rounded-xl text-sm font-medium text-[#1D1D1F] outline-none border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                  />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                  <div className="w-full md:w-40">
                      <CustomSortSelect 
                          value={sortBy} 
                          onChange={(val: string) => setSortBy(val as 'date' | 'value' | 'time')} 
                          options={[
                              { value: 'date', label: 'Date Added' },
                              { value: 'value', label: 'Job Value' },
                              { value: 'time', label: 'Job Schedule' }
                          ]}
                      />
                  </div>

                  <button 
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                      className="h-10 w-10 flex items-center justify-center bg-white rounded-xl text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm cursor-pointer transition-all active:scale-95"
                      title="Toggle Sort Order"
                  >
                      <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  </button>

                  <button 
                      onClick={fetchLeads}
                      className="h-10 w-10 flex items-center justify-center bg-white rounded-xl text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm cursor-pointer transition-all active:scale-95"
                      title="Refresh Board"
                  >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
              </div>
          </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="flex-1 bg-white rounded-[24px] border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          <LeadTable 
              leads={sortedLeads} 
              stage={currentStageId}
              onRowClick={setSelectedLead} 
              onMove={handleMoveLead} 
          />
      </div>

      {/* MODALS */}
      <Modal 
          isOpen={!!selectedLead} 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onSave={handleSaveLead} 
          onDelete={() => {}} 
          onLost={handleLostLead}
      />

      <QuoteModal 
          isOpen={isQuoteModalOpen} 
          onClose={() => setIsQuoteModalOpen(false)} 
          onSent={handleQuoteSent} 
          email={pendingActionLead?.email} 
          phone={pendingActionLead?.phone} 
          history={pendingActionLead?.quoteHistory} 
          contactId={pendingActionLead?.contactId}
          opportunityId={pendingActionLead?.id}
          lead={pendingActionLead || undefined}
      />
    </div>
  );
}