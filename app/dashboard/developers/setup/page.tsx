'use client';

import { useState, useEffect } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';

export default function SetupPage() {
  const [fields, setFields] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/ghl/scan')
      .then(res => res.json())
      .then(data => {
        setFields(data);
        setLoading(false);
      });
  }, []);

  const generateConfig = () => {
    if (!fields) return '';
    
    const findId = (name: string) => {
        const f = fields.OPPORTUNITY_FIELDS.find((f: any) => f.name.toLowerCase().includes(name.toLowerCase()));
        return f ? f.id : "MISSING_FIELD_PLEASE_CREATE";
    };

    return `export const GHL_CONFIG = {
  pipelineId: "${process.env.NEXT_PUBLIC_GHL_PIPELINE_ID || 'REPLACE_WITH_PIPELINE_ID'}",

  stageIds: {
    'new-lead': "REPLACE_WITH_NEW_LEAD_STAGE_ID",
    'quote-sent': "REPLACE_WITH_QUOTE_SENT_STAGE_ID",
    'job-booked': "REPLACE_WITH_JOB_BOOKED_STAGE_ID",
    'job-complete': "REPLACE_WITH_JOB_COMPLETE_STAGE_ID",
    'previous-jobs': "REPLACE_WITH_ARCHIVE_STAGE_ID",
  },

  customFields: {
    jobFirstName: "${findId('First Name')}",
    jobLastName: "${findId('Last Name')}",
    jobEmail: "${findId('Email')}",
    jobPhone: "${findId('Phone')}",
    jobType: "${findId('Service') || findId('Job Type')}",
    
    depositStatus: "${findId('Deposit Status')}", 
    invoiceStatus: "${findId('Invoice Status')}", 
    
    reviewStatus: "${findId('Review Status')}",  
    reviewRating: "${findId('Review Rating')}",  
    reviewChannel: "${findId('Review Channel')}",
    reviewSource: "${findId('Review Source')}",
    
    jobStart: "${findId('Job Start') || findId('Start Date')}",      
    jobEnd: "${findId('Job End') || findId('End Date')}",        
    reviewSchedule: "${findId('Review Schedule')}"
  },

  tags: {
    recaptured: "recaptured-lead"
  }
};`;
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(generateConfig());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">System Configuration Generator</h1>
        
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-bold text-lg">Detected GHL Fields</h3>
                <div className="bg-gray-50 p-4 rounded-xl h-[500px] overflow-y-auto border border-gray-200 text-xs font-mono">
                    {fields?.OPPORTUNITY_FIELDS.map((f: any) => (
                        <div key={f.id} className="flex justify-between py-1 border-b border-gray-100">
                            <span className="text-gray-700">{f.name}</span>
                            <span className="text-gray-400 select-all">{f.id}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">Generated Config</h3>
                    <button onClick={handleCopy} className="flex items-center gap-2 text-xs font-bold bg-black text-white px-3 py-1.5 rounded-lg">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Code
                    </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-6 rounded-xl text-xs overflow-auto h-[500px] select-all">
                    {generateConfig()}
                </pre>
            </div>
        </div>
    </div>
  );
}