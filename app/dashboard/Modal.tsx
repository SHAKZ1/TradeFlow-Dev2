'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, Phone, Mail, MessageSquare, Star, 
  User, ArrowRight, Pencil, Check, MapPin, Briefcase, Layout, ChevronDown, 
  Trash2, Send, AlertCircle, ShieldCheck, Award, Facebook, Megaphone, 
  PhoneIncoming, CreditCard, Receipt, FileText, MessageCircle,
  PieChart, CheckCircle2, Plus, Calculator, History, Layers, Ban, Wallet, Tag, Settings
} from 'lucide-react';
import { Lead, LeadSource, InvoiceRecord, QuoteRecord, LeadStatus, STAGE_CONFIG } from './data';
import { AlertModal } from './AlertModal';
import { QuoteModal, BookingModal, ReviewHistoryModal } from './TriggerModals';
import { SendTextModal, SendEmailModal, JobTicketModal, InvoiceModal, ManualPaymentModal  } from './ActionModals';
import { ElitePhoneInput, validatePhone } from './PhoneInput';
import { CustomField } from './settings/components/DocumentBuilder';
import { JobSpecsModal } from './components/JobSpecsModal';
import { JobCostingModal } from './components/JobCostingModal';
import { CostRate } from './settings/components/CostRateManager';
import { DynamicJobForm } from './components/DynamicJobForm';
import { BookingManager } from './components/BookingManager';
import Link from 'next/link'; // Add this

// --- STYLING CONSTANTS ---
const overlayClass = "fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[9000] flex items-center justify-center p-4 sm:p-6";

// --- HELPERS ---
const getMinDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

const getSourceConfig = (source: LeadSource = 'Manual') => {
    switch (source) {
        case 'Whatsapp': return { bg: 'bg-[#25D366]/10', text: 'text-[#25D366]', icon: <MessageCircle className="w-4 h-4" />, label: 'WhatsApp' };
        case 'Checkatrade': return { bg: 'bg-slate-100', text: 'text-slate-700', icon: <ShieldCheck className="w-4 h-4" />, label: 'Checkatrade' };
        case 'TrustATrader': return { bg: 'bg-orange-50', text: 'text-orange-700', icon: <Award className="w-4 h-4" />, label: 'TrustATrader' };
        case 'SMS': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <MessageSquare className="w-4 h-4" />, label: 'SMS' };
        case 'Email': return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <Mail className="w-4 h-4" />, label: 'Email' };
        case 'Meta': return { bg: 'bg-blue-50', text: 'text-[#1877F2]', icon: <Facebook className="w-4 h-4" />, label: 'Meta' };
        case 'Google Ads': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Megaphone className="w-4 h-4" />, label: 'Google Ads' };
        case 'Missed Call': return { bg: 'bg-red-50', text: 'text-red-600', icon: <Phone className="w-4 h-4" />, label: 'Missed Call' };
        case 'Phone Call': return { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: <PhoneIncoming className="w-4 h-4" />, label: 'Phone Call' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: <User className="w-4 h-4" />, label: 'Manual / Other' };
    }
};

const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

interface ModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead, closeModal?: boolean) => void;
  onDelete?: (leadId: string) => void;
  onLost?: (leadId: string) => void;
  hasTestimonialLicense?: boolean;
}

// Updated Tab Type
type TabType = 'client' | 'financials' | 'booking' | 'details' | 'profit' | 'history';

export function Modal({ lead, isOpen, onClose, onSave, onDelete, onLost, hasTestimonialLicense = true }: ModalProps) {
  const [formData, setFormData] = useState<Lead | null>(null);
  const [duration, setDuration] = useState<string>('0');
  const [errors, setErrors] = useState<{ phone?: boolean, email?: boolean }>({});
  const [activeTab, setActiveTab] = useState<TabType>('client');
  
  // Modal States
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isLostAlertOpen, setIsLostAlertOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isReviewHistoryOpen, setIsReviewHistoryOpen] = useState(false);
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  
  // Action Modals
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isJobTicketOpen, setIsJobTicketOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Safety States
  const [validationAlert, setValidationAlert] = useState<{ isOpen: boolean, message: string } | null>(null);
  const [unsavedAlert, setUnsavedAlert] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'quote' | 'invoice' | 'sms' | 'email' | null>(null);
  
  // Stripe Status
  const [isStripeActive, setIsStripeActive] = useState(false);
  
  const [documentConfig, setDocumentConfig] = useState<CustomField[]>([]);
  const [isJobCostingOpen, setIsJobCostingOpen] = useState(false);
  const [costRates, setCostRates] = useState<CostRate[]>([]);
  
  // --- LOAD SETTINGS ON OPEN ---
  useEffect(() => {
      if (isOpen) {
          fetch('/api/settings')
              .then(res => res.json())
              .then(data => {
                  if (data.documentConfig) setDocumentConfig(data.documentConfig);
                  if (data.costRates) setCostRates(data.costRates);
                  if (data.stripe?.isConnected) setIsStripeActive(true);
              })
              .catch(err => console.error("Failed to load settings", err));
          
          fetch('/api/integrations/status')
              .then(res => res.json())
              .then(data => {
                  if (data.stripe?.isConnected) setIsStripeActive(true);
              })
              .catch(err => console.error("Failed to check stripe status", err));
      }
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      setFormData(lead);
      setErrors({});
      setActiveTab('client'); // Reset tab on open
      if (lead.jobDate && lead.jobEndDate) {
        const start = new Date(lead.jobDate).getTime();
        const end = new Date(lead.jobEndDate).getTime();
        const diffHours = (end - start) / (1000 * 60 * 60);
        setDuration(diffHours.toFixed(1));
      } else {
        setDuration('0');
      }
    }
  }, [lead]);

  // --- CHANGE DETECTION ENGINE ---
  const hasUnsavedChanges = () => {
      if (!lead || !formData) return false;
      
      const normalize = (v: any) => v === null || v === undefined ? '' : String(v);
      
      return (
          normalize(lead.firstName) !== normalize(formData.firstName) ||
          normalize(lead.lastName) !== normalize(formData.lastName) ||
          normalize(lead.email) !== normalize(formData.email) ||
          normalize(lead.phone) !== normalize(formData.phone) ||
          lead.value !== formData.value ||
          normalize(lead.postcode) !== normalize(formData.postcode) ||
          normalize(lead.service) !== normalize(formData.service) ||
          lead.status !== formData.status ||
          lead.depositStatus !== formData.depositStatus ||
          lead.invoiceStatus !== formData.invoiceStatus ||
          normalize(lead.notes) !== normalize(formData.notes) ||
          normalize(lead.jobDate) !== normalize(formData.jobDate) ||
          normalize(lead.jobEndDate) !== normalize(formData.jobEndDate)
      );
  };
  
  const handleJobSpecsChange = (newSpecs: Record<string, any>) => {
      if (!formData) return;
      setFormData({ ...formData, jobSpecs: newSpecs });
  };

  const handleCloseAttempt = () => {
      if (hasUnsavedChanges()) {
          setIsCloseConfirmOpen(true);
      } else {
          onClose();
      }
  };

  const handleManualPayment = async (amount: number, type: 'deposit' | 'invoice') => {
      if (!formData) return;

      try {
          const res = await fetch('/api/leads/manual-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  contactId: formData.contactId,
                  opportunityId: formData.id,
                  amount,
                  type,
                  date: new Date().toISOString()
              })
          });
          
          const data = await res.json();

          // Optimistic Update
          if (type === 'deposit') {
              const newRecord: QuoteRecord = {
                  id: data.id || Date.now().toString(),
                  type: 'Manual Deposit',
                  amount,
                  method: 'manual',
                  target: 'Manual Entry',
                  date: new Date().toISOString(),
                  status: 'paid'
              };
              setFormData(prev => prev ? { ...prev, quoteHistory: [...(prev.quoteHistory || []), newRecord] } : null);
          } else {
              const newRecord: InvoiceRecord = {
                  id: data.id || Date.now().toString(),
                  amount,
                  method: 'manual',
                  target: 'Manual Entry',
                  status: 'paid',
                  date: new Date().toISOString()
              };
              setFormData(prev => prev ? { ...prev, invoiceHistory: [...(prev.invoiceHistory || []), newRecord] } : null);
          }

      } catch (error) {
          console.error("Manual payment failed", error);
      }
  };

  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const handleChange = (field: keyof Lead, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
    if (field === 'email' && errors.email) setErrors({ ...errors, email: false });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (!formData) return;
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return;
    const isoString = dateObj.toISOString();
    let newFormData = { ...formData };

    if (type === 'start') {
        newFormData.jobDate = isoString;
        if (newFormData.jobEndDate) {
            const start = dateObj.getTime();
            const end = new Date(newFormData.jobEndDate).getTime();
            if (end > start) {
                const diff = (end - start) / (1000 * 60 * 60);
                setDuration(diff.toFixed(1));
            } else {
                const currentDur = parseFloat(duration) || 1;
                newFormData.jobEndDate = new Date(start + (currentDur * 3600000)).toISOString();
            }
        } else if (parseFloat(duration) > 0) {
             const start = dateObj.getTime();
             newFormData.jobEndDate = new Date(start + (parseFloat(duration) * 3600000)).toISOString();
        }
    } else {
        newFormData.jobEndDate = isoString;
        if (newFormData.jobDate) {
            const start = new Date(newFormData.jobDate).getTime();
            const end = dateObj.getTime();
            if (end > start) {
                const diff = (end - start) / (1000 * 60 * 60);
                setDuration(diff.toFixed(1));
            } else {
                const currentDur = parseFloat(duration) || 1;
                newFormData.jobDate = new Date(end - (currentDur * 3600000)).toISOString();
            }
        } else if (parseFloat(duration) > 0) {
            const end = dateObj.getTime();
            newFormData.jobDate = new Date(end - (parseFloat(duration) * 3600000)).toISOString();
        }
    }
    setFormData(newFormData);
  };

  const handleDurationChange = (hoursStr: string) => {
    setDuration(hoursStr);
    const hours = parseFloat(hoursStr);
    if (isNaN(hours) || !formData || !formData.jobDate) return;

    const startDate = new Date(formData.jobDate);
    const endDate = new Date(startDate.getTime() + (hours * 3600000));
    
    setFormData(prev => prev ? { ...prev, jobEndDate: endDate.toISOString() } : null);
  };

  const handleClearBooking = () => {
      if (!formData) return;
      setFormData({ ...formData, jobDate: undefined, jobEndDate: undefined });
      setDuration('0');
  };

  const handleTestimonialToggle = () => {
    if (!formData) return;
    if (!hasTestimonialLicense) return;
    if (lead?.reviewStatus === 'sent') return;
    if (formData.reviewStatus === 'sent' || formData.reviewStatus === 'scheduled') {
        setFormData({ ...formData, reviewStatus: 'none', reviewChannel: undefined, reviewScheduledDate: undefined });
        return;
    }
    setIsTestimonialModalOpen(true);
  };

  const handleTestimonialClick = () => {
      if (!formData) return;
      if (formData.reviewRating) {
          setIsReviewHistoryOpen(true);
          return;
      }
      handleTestimonialToggle();
  };

  const handleTestimonialConfirm = async (config: { channel: 'sms' | 'email', date?: string }) => {
    if (!formData) return;
    const newStatus: 'scheduled' | 'sent' = config.date ? 'scheduled' : 'sent';
    const updatedLead: Lead = {
        ...formData,
        reviewStatus: newStatus,
        reviewChannel: config.channel,
        reviewScheduledDate: config.date
    };
    setFormData(updatedLead);
    setIsTestimonialModalOpen(false);

    if (!config.date) {
        try {
            await fetch('/api/leads/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: formData.contactId,
                    opportunityId: formData.id,
                    channel: config.channel,
                    phone: formData.phone,
                    email: formData.email,
                    name: formData.firstName,
                    service: formData.service
                })
            });
            onSave(updatedLead, false);
        } catch (error) { console.error("Failed to send review", error); }
    } else {
        onSave(updatedLead, false);
    }
  };

  const handleSaveClick = (closeModal: boolean = true): boolean => {
    if (!formData) return false;
    const isPhoneValid = validatePhone(formData.phone);
    const isEmailValid = formData.email ? validateEmail(formData.email) : true;

    if (!isPhoneValid || !isEmailValid) {
        setErrors({ phone: !isPhoneValid, email: !isEmailValid });
        setValidationAlert({ isOpen: true, message: "Please correct the invalid Phone Number or Email Address before saving." });
        return false;
    }

    let finalLead = { ...formData };
    const originalDate = lead?.jobDate;
    const newDate = finalLead.jobDate;
    const dateChanged = newDate && newDate !== originalDate;

    if (dateChanged && (finalLead.status === 'new-lead' || finalLead.status === 'quote-sent')) {
        finalLead.status = 'job-booked';
    }

    onSave(finalLead, closeModal);
    return true;
  };

  const handleQuoteClick = () => {
    if (!formData || !lead) return;
    if (formData.phone !== lead.phone || formData.email !== lead.email) {
        setPendingAction('quote');
        setUnsavedAlert(true);
        return;
    }
    setIsQuoteModalOpen(true);
  };

  const handleInvoiceClick = () => {
    if (!formData || !lead) return;
    if (formData.phone !== lead.phone || formData.email !== lead.email) {
        setPendingAction('invoice');
        setUnsavedAlert(true);
        return;
    }
    setIsInvoiceModalOpen(true);
  };

  const handleSMSClick = () => {
    if (!formData || !lead) return;
    if (formData.phone !== lead.phone || formData.email !== lead.email) {
        setPendingAction('sms');
        setUnsavedAlert(true);
        return;
    }
    setIsTextModalOpen(true);
  };

  const handleEmailClick = () => {
    if (!formData || !lead) return;
    if (formData.phone !== lead.phone || formData.email !== lead.email) {
        setPendingAction('email');
        setUnsavedAlert(true);
        return;
    }
    setIsEmailModalOpen(true);
  };

  const handleInvoiceSent = (record: InvoiceRecord) => {
      if (!formData) return;
      
      const completeRecord = {
          ...record,
          target: record.target || (record.method === 'sms' ? formData.phone : formData.email)
      };

      const currentHistory = formData.invoiceHistory ? [...formData.invoiceHistory] : [];
      const newHistory = [...currentHistory, completeRecord];

      setFormData(prev => {
          if (!prev) return null;
          return { ...prev, invoiceHistory: newHistory };
      });
  };

  const handleQuoteSent = (record: QuoteRecord, newValue: number) => {
    if (!formData) return;

    const completeRecord = {
        ...record,
        target: record.target || (record.method === 'sms' ? formData.phone : formData.email)
    };

    const currentHistory = formData.quoteHistory ? [...formData.quoteHistory] : [];
    const newHistory = [...currentHistory, completeRecord];

    setFormData(prev => {
        if (!prev) return null;
        return { ...prev, quoteHistory: newHistory };
    });
  };

  if (!isOpen || !formData) return null;

  const createdDate = new Date(formData.createdAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const minDateTime = getMinDateTime();
  const showRedReview = formData.status === 'job-complete' && formData.reviewStatus === 'none';
  const sourceConfig = getSourceConfig(formData.source);

  // --- CALCULATE TOTALS FOR SIDEBAR ---
  const paidQuotes = (formData.quoteHistory || []).filter(q => q.status === 'paid').reduce((sum, q) => sum + q.amount, 0);
  const paidInvoices = (formData.invoiceHistory || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={overlayClass}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white w-full max-w-6xl h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex relative border border-gray-100"
            >
              
              {/* --- LEFT SIDEBAR --- */}
              <div className="w-80 bg-[#F9FAFB] border-r border-gray-200/60 flex flex-col shrink-0">
                  
                 {/* PROFILE HEADER */}
                  <div className="p-6 border-b border-gray-200/50">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
                              {formData.firstName?.[0]}{formData.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                              <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
                                  {formData.firstName} {formData.lastName}
                              </h2>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{formData.email}</p>
                          </div>
                      </div>

                      {/* METADATA GRID */}
                      <div className="space-y-2">
                          {formData.service && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="truncate">{formData.service}</span>
                              </div>
                          )}
                          {formData.postcode && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{formData.postcode}</span>
                              </div>
                          )}
                          {formData.jobDate && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{new Date(formData.jobDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                              </div>
                          )}
                          {formData.phone && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{formData.phone}</span>
                              </div>
                          )}
                      </div>
                      
                      {/* TAGS */}
                      <div className="mt-5 flex flex-wrap gap-2">
                          {(() => {
                              const stageConfig = STAGE_CONFIG[formData.status as LeadStatus] || STAGE_CONFIG['new-lead'];
                              return (
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${stageConfig.bg} ${stageConfig.color} ${stageConfig.border}`}>
                                      {formData.status.replace('-', ' ')}
                                  </span>
                              );
                          })()}
                          
                          {/* DEPOSIT TAG */}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1
                              ${paidQuotes > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              <PieChart className="w-3 h-3" /> £{paidQuotes.toLocaleString()}
                          </span>

                          {/* INVOICE TAG */}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1
                              ${paidInvoices > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              <Receipt className="w-3 h-3" /> £{paidInvoices.toLocaleString()}
                          </span>
                      </div>

                      {/* JOB SHEET BUTTON */}
                      <button 
                          onClick={() => setIsJobTicketOpen(true)}
                          className="mt-5 w-full py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer outline-none"
                      >
                          <FileText className="w-3.5 h-3.5 text-gray-500" /> View Job Sheet
                      </button>
                  </div>

                  {/* NAVIGATION TABS */}
                  <div className="p-4 flex-1 flex flex-col gap-1">
                      <button 
                          onClick={() => setActiveTab('client')}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                              ${activeTab === 'client' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                          <User className="w-4 h-4" /> Client Info
                      </button>
                      <button 
                          onClick={() => setActiveTab('financials')}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                              ${activeTab === 'financials' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                          <CreditCard className="w-4 h-4" /> Financials
                      </button>
                      <button 
                          onClick={() => setActiveTab('booking')}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                              ${activeTab === 'booking' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                          <Calendar className="w-4 h-4" /> Booking Info
                      </button>
                      <button 
                          onClick={() => setActiveTab('details')}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                              ${activeTab === 'details' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                          <Layers className="w-4 h-4" /> Job Details
                      </button>
                      <button 
                          onClick={() => setActiveTab('profit')}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                              ${activeTab === 'profit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                          <Calculator className="w-4 h-4" /> Profit Calculator
                      </button>
                      <button 
                          onClick={() => setActiveTab('history')}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                              ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                          <History className="w-4 h-4" /> History
                      </button>
                  </div>

                  {/* QUICK ACTIONS */}
                  <div className="p-6 border-t border-gray-200/50">
                      <div className="flex gap-3">
                          <button 
                              onClick={handleSMSClick} 
                              className="flex-1 h-11 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer outline-none"
                          >
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-xs font-bold">Send SMS</span>
                          </button>
                          <button 
                              onClick={handleEmailClick} 
                              className="flex-1 h-11 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer outline-none"
                          >
                              <Mail className="w-4 h-4" />
                              <span className="text-xs font-bold">Send Email</span>
                          </button>
                      </div>
                  </div>
              </div>

              {/* --- MAIN CONTENT --- */}
              <div className="flex-1 flex flex-col bg-white min-w-0">
                  
                  {/* CONTENT HEADER */}
                  <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                      <h3 className="text-lg font-bold text-gray-900">
                          {activeTab === 'client' && 'Client Info'}
                          {activeTab === 'financials' && 'Financials'}
                          {activeTab === 'booking' && 'Booking Info'}
                          {activeTab === 'details' && 'Job Details'}
                          {activeTab === 'profit' && 'Profit Calculator'}
                          {activeTab === 'history' && 'Activity History'}
                      </h3>
                      <button onClick={handleCloseAttempt} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* SCROLLABLE AREA */}
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      
                      {/* TAB: CLIENT INFO */}
                      {activeTab === 'client' && (
                          <div className="space-y-8 max-w-3xl mx-auto">
                              
                              {/* IDENTITY CARD */}
                              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Client Information</h4>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                      <EditableText value={formData.firstName} onChange={(val) => handleChange('firstName', val)} placeholder="First Name" />
                                      <EditableText value={formData.lastName} onChange={(val) => handleChange('lastName', val)} placeholder="Last Name" />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Email</label>
                                          <input 
                                              value={formData.email} 
                                              onChange={(e) => handleChange('email', e.target.value)}
                                              className="w-full h-12 bg-[#F5F5F7] rounded-2xl px-4 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                          />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Phone</label>
                                          <div className="h-12">
                                              <ElitePhoneInput 
                                                  value={formData.phone} 
                                                  onChange={(phone, isValid) => handleChange('phone', phone)}
                                              />
                                          </div>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Postcode</label>
                                          <input 
                                              value={formData.postcode} 
                                              onChange={(e) => handleChange('postcode', e.target.value)}
                                              className="w-full h-12 bg-[#F5F5F7] rounded-2xl px-4 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                          />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-semibold text-gray-500 uppercase">Service Type</label>
                                          <input 
                                              value={formData.service} 
                                              onChange={(e) => handleChange('service', e.target.value)}
                                              className="w-full h-12 bg-[#F5F5F7] rounded-2xl px-4 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                          />
                                      </div>
                                  </div>

                                  <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-gray-500 uppercase">Pipeline Stage</label>
                                      <CustomSelect 
                                          value={formData.status} 
                                          onChange={(val) => handleChange('status', val)} 
                                          options={[
                                              { value: 'new-lead', label: 'New Lead' },
                                              { value: 'quote-sent', label: 'Quote Sent' },
                                              { value: 'job-booked', label: 'Job Booked' },
                                              { value: 'job-complete', label: 'Job Complete' },
                                              { value: 'previous-jobs', label: 'Archive' },
                                              { value: 'lost', label: 'Lost' }
                                          ]}
                                          icon={<Layout className="w-4 h-4" />}
                                      />
                                  </div>
                              </div>

                              {/* INTELLIGENCE (Source & Review) */}
                              <div className="grid grid-cols-2 gap-4">
                                  {/* Source */}
                                  <div className={`p-4 rounded-[20px] border flex flex-col justify-center gap-2 ${sourceConfig.bg} ${sourceConfig.text} border-transparent`}>
                                      <div className="flex items-center gap-2">
                                          {sourceConfig.icon}
                                          <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Source</span>
                                      </div>
                                      <span className="text-sm font-bold">{sourceConfig.label}</span>
                                  </div>

                                  {/* Review */}
                                  <div 
                                      onClick={handleTestimonialClick}
                                      className={`p-4 rounded-[20px] border flex flex-col justify-center gap-2 cursor-pointer transition-all
                                          ${!hasTestimonialLicense ? 'bg-gray-50 border-gray-100 opacity-60' : 
                                            formData.reviewRating ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 
                                            formData.reviewStatus === 'sent' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' : 
                                            formData.reviewStatus === 'scheduled' ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                                            showRedReview ? 'bg-red-50 border-red-100 text-red-700' : 
                                            'bg-white border-gray-100 hover:border-gray-200'}`}
                                  >
                                      <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                              {formData.reviewRating ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                                              <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">Review</span>
                                          </div>
                                          <ArrowRight className="w-3 h-3" />
                                      </div>
                                      
                                      <span className="text-sm font-bold truncate">
                                          {formData.reviewRating ? `${Number(formData.reviewRating).toFixed(1)} Average` : 
                                           formData.reviewStatus === 'sent' ? 'Request Sent' : 
                                           formData.reviewStatus === 'scheduled' ? 'Scheduled' : 
                                           'Not Requested'}
                                      </span>
                                  </div>
                              </div>

                              {/* NOTES */}
                              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Field Notes</h4>
                                  <textarea 
                                      value={formData.notes || ''} 
                                      onChange={(e) => handleChange('notes', e.target.value)}
                                      className="w-full h-32 p-4 bg-yellow-50/30 rounded-2xl text-sm text-gray-700 border border-yellow-100/50 outline-none focus:ring-2 focus:ring-yellow-100 resize-none leading-relaxed placeholder-gray-400" 
                                      placeholder="Add job details, access codes, or customer preferences..." 
                                  />
                              </div>

                          </div>
                      )}

                      {/* TAB: FINANCIALS */}
                      {activeTab === 'financials' && (
                          <div className="max-w-3xl mx-auto space-y-6">
                              
                              {/* FINANCIAL ENGINE CARD */}
                              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
                                  <div className="flex justify-between items-center mb-6 relative z-10">
                                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Financial Engine</h4>
                                      {isStripeActive && (
                                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                              Stripe Active
                                          </span>
                                      )}
                                  </div>

                                  <div className="flex items-center justify-between mb-6">
                                      <div>
                                          <p className="text-sm text-gray-500 font-medium">Total Value</p>
                                          <EditableValue value={formData.value} onChange={(val) => handleChange('value', val)} />
                                      </div>
                                  </div>

                                  {/* FINANCIAL BREAKDOWN BAR */}
                                  {(() => {
                                      const total = formData.value || 0;
                                      const totalPaid = paidQuotes + paidInvoices;
                                      const rawRemaining = total - totalPaid;
                                      const isOverpaid = rawRemaining < 0;
                                      const isPaidInFull = rawRemaining === 0 && total > 0;
                                      const remaining = Math.abs(rawRemaining);
                                      const progress = total > 0 ? Math.min((totalPaid / total) * 100, 100) : 0;

                                      let containerClass = 'bg-white border-gray-200';
                                      let labelClass = 'text-gray-400';
                                      let valueClass = 'text-gray-900';
                                      let barClass = 'bg-gradient-to-r from-emerald-400 to-teal-500';
                                      let labelText = 'Remaining Balance';

                                      if (isOverpaid) {
                                          containerClass = 'bg-amber-50 border-amber-100';
                                          labelClass = 'text-amber-600';
                                          valueClass = 'text-amber-700';
                                          barClass = 'bg-amber-500';
                                          labelText = 'Overpaid Amount';
                                      } else if (isPaidInFull) {
                                          containerClass = 'bg-emerald-50 border-emerald-100';
                                          labelClass = 'text-emerald-600';
                                          valueClass = 'text-emerald-700';
                                          barClass = 'bg-emerald-500';
                                          labelText = 'All Settled';
                                      }

                                      return (
                                          <div className={`rounded-2xl border p-4 shadow-sm transition-colors duration-300 ${containerClass} mb-6`}>
                                              <div className="flex justify-between items-end mb-2">
                                                  <div>
                                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>
                                                          {labelText}
                                                      </p>
                                                      <p className={`text-2xl font-bold tracking-tight ${valueClass}`}>
                                                          {isPaidInFull ? 'Paid in Full' : `£${remaining.toLocaleString()}`}
                                                      </p>
                                                  </div>
                                                  <div className="text-right">
                                                      <div className="flex items-center justify-end gap-2 mb-0.5">
                                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Paid</p>
                                                          <button 
                                                              onClick={() => setIsManualPaymentOpen(true)}
                                                              className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer border-none outline-none"
                                                              title="Record Manual Payment"
                                                          >
                                                              <Plus className="w-3 h-3" />
                                                          </button>
                                                      </div>
                                                      <p className="text-sm font-bold text-emerald-600">£{totalPaid.toLocaleString()}</p>
                                                  </div>
                                              </div>
                                              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                  <div className={`h-full transition-all duration-500 ease-out ${barClass}`} style={{ width: `${progress}%` }} />
                                              </div>
                                          </div>
                                      );
                                  })()}

                                  <div className="grid grid-cols-2 gap-4 mb-6">
                                      <div 
                                          onClick={() => handleChange('depositStatus', formData.depositStatus === 'paid' ? 'unpaid' : 'paid')}
                                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                                              ${formData.depositStatus === 'paid' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-transparent'}`}
                                      >
                                          <div>
                                              <span className={`text-xs font-bold block ${formData.depositStatus === 'paid' ? 'text-blue-700' : 'text-gray-500'}`}>Deposit</span>
                                              <span className={`text-sm font-bold ${formData.depositStatus === 'paid' ? 'text-blue-900' : 'text-gray-400'}`}>£{paidQuotes.toLocaleString()}</span>
                                          </div>
                                          {formData.depositStatus === 'paid' && <Check className="w-4 h-4 text-blue-600" />}
                                      </div>
                                      <div 
                                          onClick={() => handleChange('invoiceStatus', formData.invoiceStatus === 'paid' ? 'unpaid' : 'paid')}
                                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                                              ${formData.invoiceStatus === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-transparent'}`}
                                      >
                                          <div>
                                              <span className={`text-xs font-bold block ${formData.invoiceStatus === 'paid' ? 'text-emerald-700' : 'text-gray-500'}`}>Invoice</span>
                                              <span className={`text-sm font-bold ${formData.invoiceStatus === 'paid' ? 'text-emerald-900' : 'text-gray-400'}`}>£{paidInvoices.toLocaleString()}</span>
                                          </div>
                                          {formData.invoiceStatus === 'paid' && <Check className="w-4 h-4 text-emerald-600" />}
                                      </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                      <button 
                                          onClick={handleQuoteClick}
                                          className="py-2.5 bg-white hover:bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-blue-100 shadow-sm hover:shadow-md cursor-pointer"
                                      >
                                          <Send className="w-3.5 h-3.5" /> Send Deposit Quote
                                      </button>
                                      <button 
                                          onClick={handleInvoiceClick}
                                          className="py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-emerald-100 shadow-sm hover:shadow-md cursor-pointer"
                                      >
                                          <Receipt className="w-3.5 h-3.5" /> Send Invoice
                                      </button>
                                  </div>
                              </div>

                              {/* TRANSACTION HISTORY (NEW APPLE STYLE LIST) */}
                              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Transaction History</h4>
                                  
                                  {(!formData.quoteHistory?.length && !formData.invoiceHistory?.length) ? (
                                      <div className="text-center py-8 text-gray-400 text-xs">No transactions recorded yet.</div>
                                  ) : (
                                      <div className="space-y-3">
                                          {[...(formData.quoteHistory || []), ...(formData.invoiceHistory || [])]
                                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                              .map((item, i) => {
                                                  const isQuote = 'type' in item;
                                                  const isPaid = item.status === 'paid';
                                                  const isManual = item.method === 'manual';
                                                  
                                                  // 1. Intelligent Naming Logic
                                                  let title = "";
                                                  if (isManual) {
                                                      title = isQuote ? "Manual Deposit Payment" : "Manual Invoice Payment";
                                                  } else {
                                                      title = isQuote ? `${item.type} Quote` : "Invoice";
                                                  }

                                                  // 2. Apple-Style Icon Logic
                                                  // Paid = Solid Green Circle with White Check
                                                  // Sent = Soft Background with Colored Icon
                                                  return (
                                                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                                          <div className="flex items-center gap-3">
                                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                                                                  ${isPaid 
                                                                    ? 'bg-emerald-500 text-white shadow-sm' // Paid Style
                                                                    : isQuote 
                                                                        ? 'bg-blue-50 text-blue-600 border border-blue-100' // Quote Style
                                                                        : 'bg-gray-100 text-gray-500 border border-gray-200' // Invoice Style
                                                                  }`}>
                                                                  {isPaid ? <Check className="w-5 h-5" strokeWidth={3} /> : (isQuote ? <FileText className="w-4 h-4" /> : <Receipt className="w-4 h-4" />)}
                                                              </div>
                                                              <div>
                                                                  <p className={`text-sm font-bold ${isPaid ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                      {title}
                                                                  </p>
                                                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                                                                      <span>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                                                      <span>•</span>
                                                                      <span className="capitalize">{item.method}</span>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                          
                                                          <div className="text-right">
                                                              <p className={`text-sm font-bold tabular-nums ${isPaid ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                                  £{item.amount.toLocaleString()}
                                                              </p>
                                                              <span className={`text-[9px] font-bold uppercase tracking-wide ${isPaid ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                  {isPaid ? 'Paid' : 'Sent'}
                                                              </span>
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                      </div>
                                  )}
                              </div>

                          </div>
                      )}

                      {/* TAB: BOOKING INFO */}
{activeTab === 'booking' && (
    <div className="max-w-3xl mx-auto">
        <BookingManager 
            bookings={formData.bookings || []}
            onChange={(newBookings) => {
                // Update local state
                const updatedLead = { ...formData, bookings: newBookings };
                
                // OPTIONAL: Sync legacy fields for GHL compatibility
                // We take the earliest start date and latest end date from the list
                if (newBookings.length > 0) {
                    const sorted = [...newBookings].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                    updatedLead.jobDate = sorted[0].startDate;
                    
                    // Find the very last end date
                    const sortedEnd = [...newBookings].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
                    updatedLead.jobEndDate = sortedEnd[0].endDate;
                } else {
                    updatedLead.jobDate = undefined;
                    updatedLead.jobEndDate = undefined;
                }

                setFormData(updatedLead);
            }}
        />
    </div>
)}

                      {/* TAB: JOB DETAILS */}
                      {activeTab === 'details' && (
                          <div className="max-w-3xl mx-auto">
                              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm min-h-[400px]">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Custom Job Details</h4>
                                  
                                  {documentConfig.length === 0 ? (
                                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                          <div className="w-16 h-16 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-4">
                                              <Settings className="w-7 h-7 text-gray-400" />
                                          </div>
                                          <h3 className="text-sm font-semibold text-[#1D1D1F]">No Fields Configured</h3>
                                          <p className="text-xs text-[#86868B] mt-2 max-w-[280px] leading-relaxed">
                                              Tailor your job sheets by adding custom data points in your workspace settings.
                                          </p>
                                          <Link 
                                              href="/dashboard/settings" 
                                              className="mt-6 px-6 py-2.5 bg-[#007AFF] hover:bg-[#0062cc] text-white text-xs font-bold rounded-full transition-all shadow-sm hover:shadow-md no-underline"
                                          >
                                              Configure Settings
                                          </Link>
                                      </div>
                                  ) : (
                                      <DynamicJobForm 
                                          config={documentConfig}
                                          values={formData.jobSpecs || {}}
                                          onChange={handleJobSpecsChange}
                                      />
                                  )}
                              </div>
                          </div>
                      )}

                      {/* TAB: PROFIT CALCULATOR */}
                      {activeTab === 'profit' && (
                          <div className="max-w-3xl mx-auto">
                              <ProfitPanel 
                                  lead={formData} 
                                  costRates={costRates} 
                              />
                          </div>
                      )}

                      {/* TAB: HISTORY */}
                      {activeTab === 'history' && (
                          <div className="max-w-3xl mx-auto space-y-6">
                              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm min-h-[500px]">
                                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">Unified Activity Log</h4>
                                  
                                  <div className="relative pl-8 border-l border-gray-100 space-y-8">
                                      {(() => {
                                          // 1. AGGREGATE ALL EVENTS
                                          const events = [
                                              // Creation
                                              {
                                                  id: 'create',
                                                  date: new Date(formData.createdAt),
                                                  type: 'Creation',
                                                  title: 'Lead Created',
                                                  desc: `Source: ${formData.source}`,
                                                  icon: User,
                                                  color: 'bg-gray-100 text-gray-600'
                                              },
                                              // Quotes
                                              ...(formData.quoteHistory || []).map(q => ({
                                                  id: q.id,
                                                  date: new Date(q.date),
                                                  type: 'Quote',
                                                  title: `${q.type} Quote ${q.status === 'paid' ? 'Paid' : 'Sent'}`,
                                                  desc: `Value: £${q.amount.toLocaleString()} • Via: ${q.method === 'manual' ? 'Manual Entry' : q.method.toUpperCase()}`,
                                                  icon: FileText,
                                                  color: q.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                              })),
                                              // Invoices
                                              ...(formData.invoiceHistory || []).map(i => ({
                                                  id: i.id,
                                                  date: new Date(i.date),
                                                  type: 'Invoice',
                                                  title: `Invoice ${i.status === 'paid' ? 'Paid' : 'Sent'}`,
                                                  desc: `Value: £${i.amount.toLocaleString()} • Via: ${i.method === 'manual' ? 'Manual Entry' : i.method.toUpperCase()}`,
                                                  icon: Receipt,
                                                  color: i.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                              })),
                                              // Bookings
                                              ...(formData.bookings || []).map(b => ({
                                                  id: b.id,
                                                  date: new Date(b.startDate), // Use start date as the "Event" time
                                                  type: 'Booking',
                                                  title: 'Job Scheduled',
                                                  desc: `${new Date(b.startDate).toLocaleDateString()} • ${new Date(b.startDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${new Date(b.endDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`,
                                                  icon: Calendar,
                                                  color: 'bg-purple-100 text-purple-600'
                                              }))
                                          ];

                                          // Reviews (If scheduled/sent)
                                          if (formData.reviewScheduledDate) {
                                              events.push({
                                                  id: 'review',
                                                  date: new Date(formData.reviewScheduledDate),
                                                  type: 'Review',
                                                  title: `Review Request ${formData.reviewStatus === 'sent' ? 'Sent' : 'Scheduled'}`,
                                                  desc: `Channel: ${formData.reviewChannel?.toUpperCase() || 'SMS'}`,
                                                  icon: Star,
                                                  color: 'bg-yellow-100 text-yellow-600'
                                              });
                                          }

                                          // 2. SORT & RENDER
                                          return events
                                              .sort((a, b) => b.date.getTime() - a.date.getTime())
                                              .map((event, i) => (
                                                  <div key={event.id + i} className="relative group">
                                                      {/* Timeline Dot */}
                                                      <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${event.color}`}>
                                                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                      </div>

                                                      {/* Content Card */}
                                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                          <div>
                                                              <h5 className="text-sm font-bold text-gray-900">{event.title}</h5>
                                                              <p className="text-xs text-gray-500 font-medium mt-0.5">{event.desc}</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                                                  {event.date.toLocaleDateString('en-GB', { 
                                                                      weekday: 'short', 
                                                                      day: 'numeric', 
                                                                      month: 'short', 
                                                                      year: 'numeric' 
                                                                  })}
                                                              </span>
                                                              <p className="text-[10px] text-gray-300 font-mono">
                                                                  {event.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                              </p>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ));
                                      })()}
                                  </div>
                              </div>
                          </div>
                      )}

                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white shrink-0">
                      <div className="flex gap-4">
                          <button onClick={() => setIsDeleteAlertOpen(true)} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-transparent border-none outline-none cursor-pointer">Delete</button>
                          <button onClick={() => setIsLostAlertOpen(true)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none outline-none cursor-pointer">Mark Lost</button>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={handleCloseAttempt} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors bg-transparent border-none outline-none cursor-pointer">Cancel</button>
                          <button onClick={() => handleSaveClick(true)} className="px-8 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 border-none outline-none cursor-pointer">Save Changes</button>
                      </div>
                  </div>

              </div>

            </motion.div>
          </motion.div>

          {/* ALERTS & SUB-MODALS */}
          {(() => {
              let btnColor = "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20";
              if (pendingAction === 'quote') btnColor = "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20";
              if (pendingAction === 'invoice') btnColor = "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20";
              if (pendingAction === 'sms') btnColor = "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20";
              if (pendingAction === 'email') btnColor = "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20";

              return (
                  <>
                      <AlertModal 
                        isOpen={unsavedAlert}
                        type="warning"
                        title="Unsaved Changes"
                        message="You have changed the contact details. We must save these changes before proceeding."
                        confirmText="Save & Continue"
                        confirmButtonColor={btnColor}
                        onClose={() => {
                            setUnsavedAlert(false);
                            setPendingAction(null);
                        }}
                        onConfirm={() => {
                            setUnsavedAlert(false);
                            const success = handleSaveClick(false); 
                            if (success) {
                                setTimeout(() => {
                                    if (pendingAction === 'quote') setIsQuoteModalOpen(true);
                                    if (pendingAction === 'invoice') setIsInvoiceModalOpen(true);
                                    if (pendingAction === 'sms') setIsTextModalOpen(true);
                                    if (pendingAction === 'email') setIsEmailModalOpen(true);
                                    setPendingAction(null);
                                }, 300);
                            }
                        }}
                      />

                      <AlertModal 
                        isOpen={!!validationAlert}
                        type="warning"
                        title="Invalid Details"
                        message={validationAlert?.message || ''}
                        confirmText="Okay"
                        confirmButtonColor={btnColor}
                        onClose={() => setValidationAlert(null)}
                      />

                      <AlertModal 
                        isOpen={isCloseConfirmOpen}
                        type="warning"
                        title="Unsaved Modifications"
                        message="You have pending changes in this workspace. Would you like to commit these changes to the permanent record before exiting?"
                        confirmText="Yes, Save Changes"
                        cancelText="No, Discard"
                        confirmButtonColor="bg-gray-900 hover:bg-black shadow-gray-200"
                        onClose={() => setIsCloseConfirmOpen(false)}
                        onConfirm={() => {
                            setIsCloseConfirmOpen(false);
                            handleSaveClick(true);
                        }}
                        onCancel={() => {
                            setIsCloseConfirmOpen(false);
                            onClose();
                        }}
                      />

                      <AlertModal 
                        isOpen={isDeleteAlertOpen}
                        type="danger"
                        title="Delete Lead?"
                        message="Are you sure you want to delete this lead? This action cannot be undone."
                        confirmText="Yes, Delete"
                        onClose={() => setIsDeleteAlertOpen(false)}
                        onConfirm={() => {
                            if (formData?.id && onDelete) onDelete(formData.id);
                            setIsDeleteAlertOpen(false);
                        }}
                      />

                      <AlertModal 
                        isOpen={isLostAlertOpen}
                        type="danger"
                        title="Mark Job as Lost?"
                        message="Are you sure? This will remove the card from your board and mark the opportunity as 'Lost' in the CRM."
                        confirmText="Yes, Mark Lost"
                        onClose={() => setIsLostAlertOpen(false)}
                        onConfirm={() => {
                            if (onLost && formData?.id) onLost(formData.id);
                            setIsLostAlertOpen(false);
                        }}
                      />

                      <ManualPaymentModal 
                          isOpen={isManualPaymentOpen} 
                          onClose={() => setIsManualPaymentOpen(false)} 
                          onConfirm={handleManualPayment} 
                      />
                  </>
              );
          })()}

          {/* ACTION MODALS */}
          <TestimonialModal 
            isOpen={isTestimonialModalOpen}
            onClose={() => setIsTestimonialModalOpen(false)}
            onConfirm={handleTestimonialConfirm}
            email={formData.email}
            phone={formData.phone}
            minDate={minDateTime}
          />
          
          <QuoteModal 
              isOpen={isQuoteModalOpen} 
              onClose={() => setIsQuoteModalOpen(false)} 
              onSent={handleQuoteSent} 
              lead={formData}
              email={formData.email}
              phone={formData.phone}
              history={formData.quoteHistory}
              contactId={formData.contactId}
              opportunityId={formData.id}
          />

          <ReviewHistoryModal 
              isOpen={isReviewHistoryOpen}
              onClose={() => setIsReviewHistoryOpen(false)}
              rating={Number(formData.reviewRating) || 5}
              source={formData.reviewSource || 'Google'}
              text={formData.reviewText}
          />

          <SendTextModal isOpen={isTextModalOpen} onClose={() => setIsTextModalOpen(false)} lead={formData} />
          <SendEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} lead={formData} />
          
          <JobTicketModal 
              isOpen={isJobTicketOpen} 
              onClose={() => setIsJobTicketOpen(false)} 
              lead={formData} 
              onOpenTestimonial={() => {
                  setIsJobTicketOpen(false);
                  setTimeout(() => handleTestimonialClick(), 200);
              }}
          />

          <JobCostingModal 
            isOpen={isJobCostingOpen}
            onClose={() => setIsJobCostingOpen(false)}
            lead={formData}
            costRates={costRates}
          />
          
          <InvoiceModal 
              isOpen={isInvoiceModalOpen} 
              onClose={() => setIsInvoiceModalOpen(false)} 
              onSent={handleInvoiceSent} 
              lead={formData}
              email={formData.email}
              phone={formData.phone}
              history={formData.invoiceHistory}
              contactId={formData.contactId}
              opportunityId={formData.id}
              name={formData.firstName}
              value={formData.value}
          />
          
          {/* NOTE: JobSpecsModal is now integrated into the tab, but we keep the modal for compatibility if needed, 
              though in this layout we use DynamicJobForm directly. */}

        </>
      )}
    </AnimatePresence>
  );
}

// --- PROFIT PANEL (INLINE COMPONENT) ---
function ProfitPanel({ lead, costRates }: { lead: Lead, costRates: CostRate[] }) {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'smart' | 'custom' | 'subcontractor'>('smart');
    const [selectedRateId, setSelectedRateId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [subName, setSubName] = useState('');
    const [subPhone, setSubPhone] = useState('');
    const [subEmail, setSubEmail] = useState('');

    useEffect(() => {
        fetch(`/api/leads/expenses?opportunityId=${lead.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.expenses) setExpenses(data.expenses);
                setLoading(false);
            });
    }, [lead.id]);

    const handleAdd = async () => {
        let label = '';
        let amount = 0;
        let category = 'other';
        let sName = undefined;
        let sPhone = undefined;
        let sEmail = undefined;

        if (mode === 'smart') {
            const rate = costRates.find(r => r.id === selectedRateId);
            if (!rate || !quantity) return;
            label = `${rate.label} (${quantity} ${rate.unit}s)`;
            amount = rate.cost * parseFloat(quantity);
            category = 'smart';
        } else if (mode === 'subcontractor') {
            if (!subName || !customAmount) return;
            label = `Subcontractor: ${subName}`;
            amount = parseFloat(customAmount);
            category = 'subcontractor';
            sName = subName;
            sPhone = subPhone;
            sEmail = subEmail;
        } else {
            if (!customLabel || !customAmount) return;
            label = customLabel;
            amount = parseFloat(customAmount);
            category = 'custom';
        }

        const tempId = Date.now().toString();
        const newExpense = { id: tempId, label, amount, category, subcontractorName: sName, subcontractorPhone: sPhone, status: 'draft' };
        setExpenses(prev => [newExpense, ...prev]);

        // Reset
        setQuantity(''); setCustomLabel(''); setCustomAmount(''); setSubName(''); setSubPhone(''); setSubEmail('');

        const res = await fetch('/api/leads/expenses', {
            method: 'POST',
            body: JSON.stringify({
                opportunityId: lead.id,
                label, amount, category,
                subcontractorName: sName, subcontractorPhone: sPhone, subcontractorEmail: sEmail
            })
        });
        const data = await res.json();
        if (data.expense) {
            setExpenses(prev => prev.map(e => e.id === tempId ? data.expense : e));
        }
    };

    const handleDelete = async (id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        await fetch('/api/leads/expenses', { method: 'DELETE', body: JSON.stringify({ id }) });
    };

    const revenue = lead.value || 0;
    const totalCost = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = revenue - totalCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Real-Time Margin Analysis</h4>

            {/* HEADER STATS */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
                    <p className="text-xl font-bold text-gray-900">£{revenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Costs</p>
                    <p className="text-xl font-bold text-gray-900">£{totalCost.toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-xl border ${margin < 20 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Gross Profit</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold">£{grossProfit.toLocaleString()}</p>
                        <span className="text-xs font-medium">({margin.toFixed(1)}%)</span>
                    </div>
                </div>
            </div>

            {/* INPUT AREA */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                <div className="flex gap-2 mb-4">
                    <button onClick={() => setMode('smart')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'smart' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Smart Rate</button>
                    <button onClick={() => setMode('custom')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'custom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Custom</button>
                    <button onClick={() => setMode('subcontractor')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'subcontractor' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Subcontractor</button>
                </div>

                <div className="flex gap-3 items-end">
                    {mode === 'smart' && (
                        <>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Item</label>
                                <CustomSelect 
                                    value={selectedRateId} 
                                    onChange={setSelectedRateId} 
                                    options={costRates.map(r => ({ value: r.id, label: `${r.label} (£${r.cost}/${r.unit})` }))} 
                                    icon={<Tag className="w-4 h-4" />} 
                                />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Qty</label>
                                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full h-12 bg-white rounded-xl px-3 text-sm font-medium border-none outline-none" placeholder="0" />
                            </div>
                        </>
                    )}
                    {mode === 'custom' && (
                        <>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Description</label>
                                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="w-full h-12 bg-white rounded-xl px-3 text-sm font-medium border-none outline-none" placeholder="e.g. Parking" />
                            </div>
                            <div className="w-32">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Cost (£)</label>
                                <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="w-full h-12 bg-white rounded-xl px-3 text-sm font-medium border-none outline-none" placeholder="0.00" />
                            </div>
                        </>
                    )}
                    {mode === 'subcontractor' && (
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Name</label>
                                    <input value={subName} onChange={(e) => setSubName(e.target.value)} className="w-full h-12 bg-white rounded-xl px-3 text-sm font-medium border-none outline-none" placeholder="Name" />
                                </div>
                                <div className="w-32">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Rate (£)</label>
                                    <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="w-full h-12 bg-white rounded-xl px-3 text-sm font-medium border-none outline-none" placeholder="0.00" />
                                </div>
                            </div>
                            <div className="w-full">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Phone</label>
                                <div className="h-12"><ElitePhoneInput value={subPhone} onChange={(p) => setSubPhone(p)} /></div>
                            </div>
                        </div>
                    )}
                    
                    <button onClick={handleAdd} className="h-12 w-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all border-none outline-none cursor-pointer shrink-0 mb-0.5">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-2">
                {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${expense.category === 'subcontractor' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                {expense.category === 'subcontractor' ? <User className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{expense.label}</p>
                                {expense.category === 'subcontractor' && <p className="text-[10px] text-gray-400">Status: {expense.status || 'Draft'}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-900">£{expense.amount.toFixed(2)}</span>
                            <button onClick={() => handleDelete(expense.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 border-none outline-none cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function EditableText({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [inputWidth, setInputWidth] = useState('auto');

    useEffect(() => {
        if (spanRef.current) {
            setInputWidth(`${spanRef.current.offsetWidth + 4}px`);
        }
    }, [value, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) inputRef.current.focus();
    }, [isEditing]);

    return (
        <div className="relative flex items-center group h-10">
            <span 
                ref={spanRef} 
                className="absolute opacity-0 pointer-events-none whitespace-pre text-3xl font-bold tracking-tight"
                aria-hidden="true"
            >
                {value || placeholder}
            </span>

            {isEditing ? (
                <input 
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                    style={{ width: inputWidth }}
                   className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 placeholder-gray-300 min-w-[40px] cursor-text select-text caret-black"
                    placeholder={placeholder}
                />
            ) : (
                <div 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-1 -ml-1 transition-colors"
                >
                    <span className={`text-3xl font-bold tracking-tight ${value ? 'text-gray-900' : 'text-gray-300'}`}>
                        {value || placeholder}
                    </span>
                    <Pencil className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
    );
}

function EditableValue({ value, onChange }: { value: number, onChange: (val: number) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        if (isEditing && inputRef.current) {
            setLocalValue(value.toString());
            inputRef.current.focus();
        }
    }, [isEditing, value]);

    const handleBlur = () => {
        setIsEditing(false);
        const num = parseFloat(localValue);
        onChange(isNaN(num) ? 0 : num);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBlur();
    };

    if (isEditing) {
        return (
            <div className="relative">
                <input 
                    ref={inputRef}
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-[120px] text-2xl font-bold text-emerald-600 bg-transparent border-none outline-none focus:ring-0 text-right p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text select-text caret-black"
                />
            </div>
        );
    }

    return (
        <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
                £{value.toLocaleString()}
            </div>
            <Pencil className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function CustomSelect({ value, onChange, options, icon }: { value: string, onChange: (val: string) => void, options: { value: string, label: string }[], icon: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div ref={containerRef} className="relative h-12">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#F5F5F7] px-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-gray-200 focus-within:bg-white focus-within:shadow-sm transition-all h-full cursor-pointer"
            >
                <div className="text-gray-400">{icon}</div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{selectedLabel}</span>
                <div className="text-gray-400"><ChevronDown className="w-4 h-4" /></div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-1">
                    {options.map((opt) => (
                        <div 
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`px-4 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-colors ${value === opt.value ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DateInput({ label, value, onChange, min }: { label: string, value: string, onChange: (val: string) => void, min?: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const formattedValue = value ? new Date(value).toISOString().slice(0, 16) : '';

    return (
        <div className="w-full">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">{label}</label>
            <div 
                className="relative bg-[#F5F5F7] border border-transparent hover:border-gray-200 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all group focus-within:bg-white focus-within:shadow-sm focus-within:border-gray-200"
                onClick={() => inputRef.current?.showPicker()}
            >
                <Calendar className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {value ? new Date(value).toLocaleString('en-GB', { 
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                    }) : 'Select Date...'}
                </span>
                <input 
                    ref={inputRef}
                    type="datetime-local"
                    value={formattedValue}
                    onChange={(e) => {
                        const date = new Date(e.target.value);
                        onChange(date.toISOString());
                    }}
                    min={min}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
}

function TestimonialModal({ isOpen, onClose, onConfirm, email, phone, minDate }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onConfirm: (config: { channel: 'sms' | 'email', date?: string }) => void,
    email: string,
    phone: string,
    minDate: string 
}) {
    const [channel, setChannel] = useState<'sms' | 'email' | null>(null);
    const [timing, setTiming] = useState<'now' | 'later'>('now');
    const [scheduleDate, setScheduleDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setChannel(phone ? 'sms' : email ? 'email' : null);
            setTiming('now');
            setScheduleDate('');
        }
    }, [isOpen, phone, email]);

    const handleConfirm = () => {
        if (!channel) return;
        onConfirm({
            channel,
            date: timing === 'later' ? scheduleDate : undefined
        });
    };

    if (!isOpen) return null;

    return (
        <div className={overlayClass}>
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                className="bg-[#F9FAFB] w-full max-w-md rounded-[32px] shadow-2xl border border-white/60 overflow-hidden flex flex-col relative"
            >
                {/* HEADER */}
                <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                            <Star className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Request Review</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Boost your reputation</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* BODY */}
                <div className="p-8 space-y-6">
                    
                    {/* CHANNEL SELECTION */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider ml-1">Send Via</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => phone && setChannel('sms')}
                                disabled={!phone}
                                className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer outline-none relative overflow-hidden
                                    ${!phone ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' : 
                                      channel === 'sms' 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">SMS</span>
                            </button>
                            <button 
                                onClick={() => email && setChannel('email')}
                                disabled={!email}
                                className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer outline-none relative overflow-hidden
                                    ${!email ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' : 
                                      channel === 'email' 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                            >
                                <Mail className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Email</span>
                            </button>
                        </div>
                    </div>

                    {/* TIMING SELECTION */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block tracking-wider ml-1">Timing</label>
                        <div className="space-y-3">
                            <div 
                                onClick={() => setTiming('now')}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border
                                    ${timing === 'now' 
                                        ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
                                        : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                    ${timing === 'now' ? 'border-indigo-600' : 'border-gray-300'}`}>
                                    {timing === 'now' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900 block">Send Immediately</span>
                                    <span className="text-[11px] text-gray-500 font-medium">Request will be sent right now.</span>
                                </div>
                            </div>

                            <div 
                                onClick={() => setTiming('later')}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border
                                    ${timing === 'later' 
                                        ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-sm' 
                                        : 'bg-white border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                    ${timing === 'later' ? 'border-indigo-600' : 'border-gray-300'}`}>
                                    {timing === 'later' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900 block">Schedule for Later</span>
                                    <span className="text-[11px] text-gray-500 font-medium">Choose a specific date and time.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DATE PICKER (CONDITIONAL) */}
                    <AnimatePresence>
                        {timing === 'later' && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <DateInput label="Select Date & Time" value={scheduleDate} onChange={setScheduleDate} min={minDate} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FOOTER */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors border-none outline-none cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!channel || (timing === 'later' && !scheduleDate)}
                        className={`px-8 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5 border-none outline-none cursor-pointer
                            ${(!channel || (timing === 'later' && !scheduleDate)) 
                                ? 'bg-gray-300 cursor-not-allowed shadow-none transform-none' 
                                : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        Confirm Schedule
                    </button>
                </div>
            </motion.div>
        </div>
    );
}