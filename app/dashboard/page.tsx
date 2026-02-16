'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  MouseSensor,
  closestCorners
} from '@dnd-kit/core';
import { Search, ArrowUpDown, Plus, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import { COLUMNS, Lead, LeadStatus, QuoteRecord } from './data';
import { Column } from './Column';
import { Card } from './Card';
import { Modal } from './Modal';
import { QuoteModal, BookingModal } from './TriggerModals';
import { AlertModal } from './AlertModal';
import { CustomSortSelect } from './pipeline/components/CustomSortSelect';
import { LoadingScreen } from './components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { QuoteConfirmModal } from './components/QuoteConfirmModal';
import { BookingConfirmModal } from './components/BookingConfirmModal';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [pendingMove, setPendingMove] = useState<{ leadId: string, newStatus: LeadStatus } | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'time'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [isQuoteConfirmOpen, setIsQuoteConfirmOpen] = useState(false);
  const [isBookingConfirmOpen, setIsBookingConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. ADD THIS REF
  const isDraggingRef = useRef(false); 

  const [licenses, setLicenses] = useState({
    testimonials: true, 
    missedCall: true,
    adsRoi: false
  });

  

  const fetchLeads = async (silent = false) => {
    if (isDraggingRef.current) return; // STOP POLLING IF DRAGGING
    if (!silent) setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to connect to CRM");
      }
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (error: any) {
      console.error("Failed to fetch leads:", error);
      setError(error.message);
    } finally {
      if (!silent) {
        setTimeout(() => {
            setIsLoading(false);
            setIsRefreshing(false);
        }, 800);
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchLeads();
    // CHANGED: Increased from 15000 to 60000 (1 minute) to save bandwidth and API calls
    const interval = setInterval(() => {
        if (!document.hidden) fetchLeads(true);
    }, 60000); 
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeads();
  };

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 10 } }));

  // 3. UPDATE DRAG HANDLERS
  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true; // PAUSE UPDATES
    const { active } = event;
    const lead = leads.find(l => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const currentLead = leads.find(l => l.id === leadId);

    if (!currentLead || currentLead.status === newStatus) return;

    if (newStatus === 'previous-jobs') {
        if (currentLead.status !== 'job-complete') {
            setAlertConfig({ isOpen: true, title: "Invalid Move", message: "Only completed jobs can be archived." });
            return;
        }
    }
    
    if (newStatus === 'quote-sent') {
        setPendingMove({ leadId, newStatus });
        setIsQuoteConfirmOpen(true);
        return;
    }

    if (newStatus === 'job-booked') {
        setPendingMove({ leadId, newStatus });
        setIsBookingConfirmOpen(true);
        return;
    }

    // OPTIMISTIC UPDATE (Instant)
    updateLeadStatus(leadId, newStatus);
  };

  const handleQuoteSent = (record: QuoteRecord, newValue: number) => {
    setIsQuoteModalOpen(false);
    if (pendingMove) {
        const currentLead = leads.find(l => l.id === pendingMove.leadId);
        if (currentLead) {
            updateLeadStatus(pendingMove.leadId, pendingMove.newStatus, { 
                value: newValue,
                quoteHistory: [...(currentLead.quoteHistory || []), record]
            });
        } else {
            updateLeadStatus(pendingMove.leadId, pendingMove.newStatus);
        }
    }
    setPendingMove(null);
  };

  const handleBookingConfirm = async (data: { start: string, end: string } | null) => {
    setIsBookingModalOpen(false);
    if (pendingMove) {
        const currentLead = leads.find(l => l.id === pendingMove.leadId);
        const updates = data ? { jobDate: data.start, jobEndDate: data.end } : {};
        updateLeadStatus(pendingMove.leadId, pendingMove.newStatus, updates);
        if (data && currentLead) {
            try {
                await fetch('/api/leads/booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lead: currentLead, start: data.start, end: data.end })
                });
            } catch (error) { console.error("Failed to save booking", error); }
        } else {
             fetch('/api/leads/status', {
                method: 'PUT',
                body: JSON.stringify({ leadId: pendingMove.leadId, newStatus: pendingMove.newStatus })
            });
        }
    }
    setPendingMove(null);
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus, extraData?: Partial<Lead>) => {
    setLeads((prev) => prev.map((lead) => lead.id === leadId ? { ...lead, status: newStatus, ...extraData } : lead));
    try {
        await fetch('/api/leads/status', {
            method: 'PUT',
            body: JSON.stringify({ leadId, newStatus })
        });
    } catch (error) { console.error("Status Update Failed", error); }
  };

  const handleSaveLead = async (updatedLead: Lead, closeModal: boolean = true) => {
    if (updatedLead.id.length <= 15) {
        if (!updatedLead.firstName?.trim() || !updatedLead.lastName?.trim() || !updatedLead.email?.trim() || !updatedLead.phone?.trim()) {
            setAlertConfig({ isOpen: true, title: "Missing Information", message: "First Name, Last Name, Email, and Phone are required." });
            return; 
        }
    }
    setLeads((prev) => {
        const exists = prev.find(l => l.id === updatedLead.id);
        if (exists) return prev.map((l) => l.id === updatedLead.id ? updatedLead : l);
        return [...prev, updatedLead];
    });
    if (closeModal) setSelectedLead(null);
    else setSelectedLead(updatedLead);

    try {
        if (updatedLead.id.length > 15) { 
            await fetch('/api/leads/update', { method: 'PUT', body: JSON.stringify(updatedLead) });
        } else {
            const res = await fetch('/api/leads/create', { method: 'POST', body: JSON.stringify(updatedLead) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create lead");
            if (data.success) {
                setLeads(prev => prev.map(l => l.id === updatedLead.id ? { ...l, id: data.newId, contactId: data.contactId } : l));
                if (!closeModal) setSelectedLead(prev => prev ? { ...prev, id: data.newId, contactId: data.contactId } : null);
            }
        }
    } catch (error) {
        console.error("Save Error:", error);
        setAlertConfig({ isOpen: true, title: "Sync Error", message: "Could not save to CRM." });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    const leadToDelete = leads.find(l => l.id === leadId);
    const contactId = leadToDelete?.contactId;
    setLeads((prev) => prev.filter(l => l.id !== leadId));
    setSelectedLead(null);
    try {
        if (leadId.length > 15) {
            await fetch('/api/leads/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, contactId: contactId })
            });
        }
    } catch (error) { console.error("Failed to delete lead", error); }
  };

  const handleLostLead = async (leadId: string) => {
    setLeads((prev) => prev.filter(l => l.id !== leadId));
    setSelectedLead(null);
    try {
        if (leadId.length > 15) {
            await fetch('/api/leads/lost', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId })
            });
        }
    } catch (error) { console.error("Failed to mark lead lost", error); }
  };

  const handleAddLead = () => {
    const newLead: Lead = {
        id: Date.now().toString(),
        firstName: '', lastName: '', email: '', phone: '', value: 0,
        status: 'new-lead', postcode: '', service: '', source: 'Manual', autoTexted: false,
        reviewStatus: 'none', createdAt: new Date().toISOString(),
        depositStatus: 'unpaid', invoiceStatus: 'unpaid'
    };
    setSelectedLead(newLead);
  };

  const getFilteredAndSortedLeads = (columnId: string) => {
    let filtered = leads.filter(l => l.status === columnId);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(l => 
            (l.firstName || '').toLowerCase().includes(q) || 
            (l.lastName || '').toLowerCase().includes(q) ||
            (l.postcode || '').toLowerCase().includes(q) || 
            (l.phone || '').includes(q)
        );
    }
    return filtered.sort((a, b) => {
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
  };

  const totalValue = leads.filter(l => l.status !== 'lost').reduce((sum, l) => sum + l.value, 0);
  const totalJobs = leads.length;
  const activeJobs = leads.filter(l => l.status !== 'previous-jobs' && l.status !== 'lost').length;
  const targetLead = pendingMove ? leads.find(l => l.id === pendingMove.leadId) : null;

  if (!isMounted) return null;

  return (
    <div className="h-full flex flex-col pt-6 px-4 md:px-8 bg-[#F9FAFB]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-end mb-8 gap-6">
        
        {/* TITLE & STATS */}
        <div className="w-full xl:w-auto">
          <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight mb-6">Job Board</h1>
          
          {/* STATS ROW (Apple Style) */}
          <div className="flex items-center gap-8">
              <div>
                  <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-0.5">Pipeline Value</p>
                  <p className="text-2xl font-bold text-[#1D1D1F] tracking-tight">£{totalValue.toLocaleString()}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                  <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-0.5">Total Jobs</p>
                  <p className="text-2xl font-bold text-[#1D1D1F] tracking-tight">{totalJobs}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div>
                  <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-0.5">Active</p>
                  <p className="text-2xl font-bold text-emerald-600 tracking-tight">{activeJobs}</p>
              </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
          
          {/* SEARCH (Spotlight Style) */}
          <div className="relative group h-10 w-full md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 transition-colors group-focus-within:text-blue-600" />
              <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-full w-full bg-white rounded-xl text-sm font-medium text-[#1D1D1F] outline-none border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
              />
          </div>

          <div className="flex gap-2 h-10 w-full md:w-auto">
              <div className="w-full md:w-40">
                <CustomSortSelect 
                    value={sortBy} 
                    onChange={(val) => setSortBy(val as any)} 
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
              >
                  <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>

              <button 
                  onClick={handleRefresh}
                  className="h-10 w-10 flex items-center justify-center bg-white rounded-xl text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
          </div>

          <button 
              onClick={handleAddLead}
              className="h-10 bg-[#1D1D1F] hover:bg-black text-white px-5 rounded-xl font-semibold shadow-lg shadow-gray-200 transition-all flex items-center gap-2 justify-center border-none outline-none cursor-pointer active:scale-95 w-full md:w-auto"
          >
              <Plus className="w-4 h-4" /><span>New Lead</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
          {isLoading && <LoadingScreen />}
      </AnimatePresence>

      {!isLoading && error && (
          <div className="flex-1 flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Connection Interrupted</h3>
              <p className="text-gray-500 max-w-md mt-2 mb-6">{error}</p>
              <button 
                  onClick={() => fetchLeads()}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
              >
                  <RefreshCw className="w-4 h-4" /> Retry Connection
              </button>
          </div>
      )}

      {/* KANBAN BOARD */}
      {!isLoading && !error && (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full overflow-x-auto pb-8 snap-x snap-mandatory px-1">
              {COLUMNS.map((col) => {
              const columnLeads = getFilteredAndSortedLeads(col.id);
              const colTotal = columnLeads.reduce((sum, lead) => sum + lead.value, 0);
              return (
                  <div key={col.id} className="snap-center shrink-0 w-[85vw] md:w-[340px] h-full">
                      <Column 
                          id={col.id} 
                          title={col.title} 
                          leads={columnLeads} 
                          totalValue={colTotal} 
                          onCardClick={(lead) => setSelectedLead(lead)} 
                      />
                  </div>
              );
              })}
          </div>
          <DragOverlay>
            {activeLead ? <Card lead={activeLead} isOverlay /> : null}
          </DragOverlay>
          </DndContext>
      )}

      {/* MODALS */}
      <Modal 
          isOpen={!!selectedLead} 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onSave={handleSaveLead} 
          onDelete={handleDeleteLead}
          onLost={handleLostLead}
          hasTestimonialLicense={licenses.testimonials}
      />
      
      <QuoteModal 
          isOpen={isQuoteModalOpen} 
          onClose={() => { setIsQuoteModalOpen(false); setPendingMove(null); }} 
          onSent={handleQuoteSent} 
          email={targetLead?.email} 
          phone={targetLead?.phone} 
          history={targetLead?.quoteHistory} 
          contactId={targetLead?.contactId}
          opportunityId={targetLead?.id}
          lead={targetLead || undefined}
      />

      <QuoteConfirmModal 
          isOpen={isQuoteConfirmOpen}
          onClose={() => { setIsQuoteConfirmOpen(false); setPendingMove(null); }}
          onConfirm={() => { setIsQuoteConfirmOpen(false); setIsQuoteModalOpen(true); }}
          onSkip={() => { setIsQuoteConfirmOpen(false); if (pendingMove) updateLeadStatus(pendingMove.leadId, pendingMove.newStatus); setPendingMove(null); }}
          clientName={targetLead?.firstName || 'Client'}
      />
      
      <BookingModal 
          isOpen={isBookingModalOpen} 
          onClose={() => { setIsBookingModalOpen(false); setPendingMove(null); }} 
          onConfirm={handleBookingConfirm}
          initialStart={targetLead?.jobDate}
          initialEnd={targetLead?.jobEndDate}
      />

      <BookingConfirmModal 
          isOpen={isBookingConfirmOpen}
          onClose={() => { setIsBookingConfirmOpen(false); setPendingMove(null); }}
          onConfirm={() => { setIsBookingConfirmOpen(false); setIsBookingModalOpen(true); }}
          onSkip={() => { setIsBookingConfirmOpen(false); if (pendingMove) updateLeadStatus(pendingMove.leadId, pendingMove.newStatus); setPendingMove(null); }}
          clientName={targetLead?.firstName || 'Client'}
      />
      
      <AlertModal 
          isOpen={!!alertConfig}
          type="warning"
          title={alertConfig?.title || ''}
          message={alertConfig?.message || ''}
          onClose={() => setAlertConfig(null)}
      />
    </div>
  );
}