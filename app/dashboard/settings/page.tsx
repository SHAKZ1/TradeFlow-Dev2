'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Loader2, Save, Upload, Trash2, Building2, FileText, MessageSquare, Coins, Check, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertModal } from '../AlertModal';
import { DocumentBuilder, CustomField } from './components/DocumentBuilder';
import { TemplateEditor } from './components/TemplateEditor';
import { CommunicationConfig, DEFAULT_COMMUNICATION_CONFIG } from '@/lib/default-templates';
import { CostRateManager, CostRate } from './components/CostRateManager';

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => { resolve(fileReader.result as string); };
    fileReader.onerror = (error) => { reject(error); };
  });
};

function ImageUpload({ label, value, onChange, heightClass = "h-32", recommendation }: any) {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFile = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) { alert("File is too large. Please upload an image under 2MB."); return; }
        const base64 = await convertToBase64(file);
        onChange(base64);
    };
    return (
        <div>
            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">{label}</label>
            {value ? (
                <div className={`relative w-full ${heightClass} bg-white rounded-2xl border border-gray-200 overflow-hidden group shadow-sm transition-all hover:shadow-md`}>
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-100">
                        <img src={value} alt="Preview" className="max-w-full max-h-full object-contain z-10 relative" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 z-20">
                        <button onClick={() => inputRef.current?.click()} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all border-none outline-none cursor-pointer"><Upload className="w-4 h-4" /></button>
                        <button onClick={() => onChange('')} className="w-10 h-10 flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 text-white rounded-full backdrop-blur-md transition-all border-none outline-none cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            ) : (
                <div onClick={() => inputRef.current?.click()} className={`w-full ${heightClass} rounded-2xl border border-dashed border-gray-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group bg-[#F5F5F7] hover:bg-white hover:border-[#007AFF]/50`}>
                    <div className="w-10 h-10 rounded-full bg-white text-gray-400 shadow-sm flex items-center justify-center group-hover:text-[#007AFF] transition-all"><Upload className="w-4 h-4" /></div>
                    <div className="text-center"><p className="text-[13px] font-medium text-[#1D1D1F]">Upload Image</p><p className="text-[10px] text-[#86868B] mt-0.5">{recommendation}</p></div>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
    );
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const[successModal, setSuccessModal] = useState(false);
  
  // --- STATE ---
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const[companyEmail, setCompanyEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const[companyNiche, setCompanyNiche] = useState('');
  const [costRates, setCostRates] = useState<CostRate[]>([]);
  const [documentConfig, setDocumentConfig] = useState<CustomField[]>([]);
  const [communicationConfig, setCommunicationConfig] = useState<CommunicationConfig>(DEFAULT_COMMUNICATION_CONFIG);
  
  const [isSaving, setIsSaving] = useState(false);

  // --- DIRTY STATE TRACKING ---
  const [initialData, setInitialData] = useState<any>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const[pendingPath, setPendingPath] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
        setData(data);
        
        const loadedData = {
            logoUrl: data.branding?.logo || '',
            bannerUrl: data.branding?.banner || '',
            companyName: data.branding?.name || '',
            companyAddress: data.branding?.address || '',
            companyEmail: data.branding?.email || '',
            companyWebsite: data.branding?.website || '',
            companyNiche: data.branding?.niche || '',
            documentConfig: data.documentConfig ||[],
            communicationConfig: data.communicationConfig || DEFAULT_COMMUNICATION_CONFIG,
            costRates: data.costRates ||[]
        };

        // Set active state
        setLogoUrl(loadedData.logoUrl);
        setBannerUrl(loadedData.bannerUrl);
        setCompanyName(loadedData.companyName);
        setCompanyAddress(loadedData.companyAddress);
        setCompanyEmail(loadedData.companyEmail);
        setCompanyWebsite(loadedData.companyWebsite);
        setCompanyNiche(loadedData.companyNiche);
        setDocumentConfig(loadedData.documentConfig);
        setCommunicationConfig(loadedData.communicationConfig);
        setCostRates(loadedData.costRates);

        // Set baseline for comparison
        setInitialData(loadedData);
        setIsLoading(false);
    });
  },[]);

  // --- CALCULATE UNSAVED AREAS ---
  const getUnsavedAreas = () => {
      if (!initialData) return[];
      const areas =[];
      
      if (
          logoUrl !== initialData.logoUrl ||
          bannerUrl !== initialData.bannerUrl ||
          companyName !== initialData.companyName ||
          companyAddress !== initialData.companyAddress ||
          companyEmail !== initialData.companyEmail ||
          companyWebsite !== initialData.companyWebsite ||
          companyNiche !== initialData.companyNiche
      ) {
          areas.push('Company Profile');
      }
      
      if (JSON.stringify(documentConfig) !== JSON.stringify(initialData.documentConfig)) {
          areas.push('Job Specification Engine');
      }
      
      if (JSON.stringify(communicationConfig) !== JSON.stringify(initialData.communicationConfig)) {
          areas.push('Communication Engine');
      }
      
      if (JSON.stringify(costRates) !== JSON.stringify(initialData.costRates)) {
          areas.push('Cost Rate Engine');
      }
      
      return areas;
  };

  const unsavedAreas = getUnsavedAreas();
  const hasUnsavedChanges = unsavedAreas.length > 0;

  // --- INTERCEPT NAVIGATION ---
  useEffect(() => {
      // 1. Intercept Browser Refresh / Tab Close
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (hasUnsavedChanges) {
              e.preventDefault();
              e.returnValue = '';
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      // 2. Intercept Next.js Link Clicks
      const handleAnchorClick = (e: MouseEvent) => {
          const target = (e.target as HTMLElement).closest('a');
          if (!target) return;
          
          const href = target.getAttribute('href');
          // If it's an internal link and we have changes
          if (href && href.startsWith('/') && hasUnsavedChanges) {
              e.preventDefault();
              e.stopPropagation();
              setPendingPath(href);
              setShowUnsavedModal(true);
          }
      };
      
      document.addEventListener('click', handleAnchorClick, { capture: true });

      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener('click', handleAnchorClick, { capture: true });
      };
  },[hasUnsavedChanges]);

  // --- SAVE LOGIC ---
  const handleSaveConfig = async (redirectAfterSave = false) => {
    setIsSaving(true);
    await fetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ 
            companyLogoUrl: logoUrl, 
            companyBannerUrl: bannerUrl,
            companyName,
            companyNiche,
            companyAddress,
            companyEmail,
            companyWebsite,
            documentConfig,
            communicationConfig,
            costRates,
        })
    });
    
    // Update baseline so it's no longer "dirty"
    setInitialData({
        logoUrl, bannerUrl, companyName, companyAddress, companyEmail, companyWebsite, companyNiche, documentConfig, communicationConfig, costRates
    });

    setIsSaving(false);
    
    if (redirectAfterSave && pendingPath) {
        setShowUnsavedModal(false);
        router.push(pendingPath);
    } else {
        setSuccessModal(true);
        router.refresh();
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Are you sure? This will disconnect your GHL account.")) {
        await fetch('/api/settings', { method: 'DELETE' });
        router.push('/dashboard/connect');
        router.refresh();
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-8 px-4 md:px-8 pb-24 bg-[#F9FAFB] min-h-screen relative">
      
      {/* HEADER */}
      <div className="mb-10 flex justify-between items-end">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Settings</h1>
                {hasUnsavedChanges && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-md animate-pulse">
                        Unsaved Changes
                    </span>
                )}
            </div>
            <p className="text-[13px] text-[#86868B] font-medium mt-2">Manage your branding and account preferences.</p>
        </div>
        <button 
            onClick={() => handleSaveConfig(false)} 
            disabled={isSaving || !hasUnsavedChanges} 
            className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 border-none outline-none cursor-pointer
                ${hasUnsavedChanges 
                    ? 'bg-[#1D1D1F] hover:bg-black text-white shadow-lg shadow-gray-200' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} 
            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      <div className="space-y-8">
        
        {/* GHL CONNECTION */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[24px] p-6 border border-gray-200/60 shadow-sm">
            <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-[14px] bg-[#007AFF] flex items-center justify-center text-white shadow-md"><LinkIcon className="w-6 h-6" /></div>
                    <div>
                        <h3 className="text-[15px] font-semibold text-[#1D1D1F]">Secure Database</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                            <p className="text-[11px] text-[#86868B] font-medium">Connected to <span className="text-[#1D1D1F]">{data?.ghl?.locationName || 'Loading...'}</span></p>
                        </div>
                    </div>
                </div>
                <button onClick={handleDisconnect} className="px-4 py-2 text-[11px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 rounded-full transition-colors border-none outline-none cursor-pointer">Disconnect</button>
            </div>
        </motion.div>

        {/* BRANDING */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[24px] p-8 border border-gray-200/60 shadow-sm">
            <div className="flex gap-4 mb-8 items-center">
                <div className="w-10 h-10 rounded-[12px] bg-[#AF52DE] flex items-center justify-center text-white shadow-sm"><Building2 className="w-5 h-5" /></div>
                <div><h3 className="text-[15px] font-semibold text-[#1D1D1F]">Company Profile</h3><p className="text-[11px] text-[#86868B]">Appears on PDF Quotes and Invoices.</p></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <ImageUpload label="Company Banner" value={bannerUrl} onChange={setBannerUrl} recommendation="PNG • 200x60px • Transparent" />
              <ImageUpload label="Company Icon" value={logoUrl} onChange={setLogoUrl} heightClass="h-32 w-32" recommendation="PNG • 40x40px • Transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['Company Name', 'Website', 'Email Address', 'Full Address'].map((label, i) => {
                    const val =[companyName, companyWebsite, companyEmail, companyAddress][i];
                    const setVal =[setCompanyName, setCompanyWebsite, setCompanyEmail, setCompanyAddress][i];
                    return (
                        <div key={label}>
                            <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">{label}</label>
                            <input 
                                value={val} 
                                onChange={(e) => setVal(e.target.value)} 
                                className="w-full h-11 px-4 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all placeholder-gray-400" 
                                placeholder="Enter details..." 
                            />
                        </div>
                    );
                })}
                <div>
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Business Niche / Trade</label>
                    <input 
                        value={companyNiche} 
                        onChange={(e) => setCompanyNiche(e.target.value)} 
                        className="w-full h-11 px-4 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all placeholder-gray-400" 
                        placeholder="e.g. Emergency Plumbing, Luxury Landscaping" 
                    />
                </div>
            </div>
        </motion.div>

        {/* JOB SPECS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[24px] p-8 border border-gray-200/60 shadow-sm">
            <div className="flex gap-4 mb-8 items-center">
                <div className="w-10 h-10 rounded-[12px] bg-[#5856D6] flex items-center justify-center text-white shadow-sm"><FileText className="w-5 h-5" /></div>
                <div><h3 className="text-[15px] font-semibold text-[#1D1D1F]">Job Specification Engine</h3><p className="text-[11px] text-[#86868B]">Define bespoke data points for your jobs.</p></div>
            </div>
            <DocumentBuilder fields={documentConfig} onChange={setDocumentConfig} />
        </motion.div>

        {/* COMMUNICATION */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[24px] p-8 border border-gray-200/60 shadow-sm">
            <div className="flex gap-4 mb-8 items-center">
                <div className="w-10 h-10 rounded-[12px] bg-[#007AFF] flex items-center justify-center text-white shadow-sm"><MessageSquare className="w-5 h-5" /></div>
                <div><h3 className="text-[15px] font-semibold text-[#1D1D1F]">Communication Engine</h3><p className="text-[11px] text-[#86868B]">Customize automated messages.</p></div>
            </div>
            <TemplateEditor config={communicationConfig} onChange={setCommunicationConfig} />
        </motion.div>

        {/* COST RATES */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[24px] p-8 border border-gray-200/60 shadow-sm">
            <div className="flex gap-4 mb-8 items-center">
                <div className="w-10 h-10 rounded-[12px] bg-[#34C759] flex items-center justify-center text-white shadow-sm"><Coins className="w-5 h-5" /></div>
                <div><h3 className="text-[15px] font-semibold text-[#1D1D1F]">Cost Rate Engine</h3><p className="text-[11px] text-[#86868B]">Configure standard operational costs.</p></div>
            </div>
            <CostRateManager rates={costRates} onChange={setCostRates} />
        </motion.div>

      </div>

      <AlertModal isOpen={successModal} type="success" title="Settings Saved" message="Your configuration has been updated successfully." onClose={() => setSuccessModal(false)} />

      {/* --- UNSAVED CHANGES MODAL (APPLE OS GRADE) --- */}
      <AnimatePresence>
        {showUnsavedModal && (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[11000] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-white/40 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Unsaved Changes</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">You have pending modifications.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowUnsavedModal(false)} 
                            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors border-none outline-none cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6 bg-[#F9FAFB]">
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            You are about to leave this page, but you have unsaved changes in the following areas:
                        </p>
                        
                        <div className="space-y-2">
                            {unsavedAreas.map(area => (
                                <div key={area} className="flex items-center gap-3 text-sm font-bold text-gray-900 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                    {area}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
                        <button 
                            onClick={() => handleSaveConfig(true)}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-bold shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2 border-none outline-none cursor-pointer transform hover:-translate-y-0.5"
                        >
                            <Save className="w-4 h-4" /> Save & Continue
                        </button>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowUnsavedModal(false)}
                                className="flex-1 py-3.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border-none outline-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    setShowUnsavedModal(false);
                                    if (pendingPath) router.push(pendingPath);
                                }}
                                className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border-none outline-none cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" /> Discard
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}