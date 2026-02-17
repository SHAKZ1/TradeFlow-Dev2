// Add 'lost' to the union type
export type LeadStatus =
  | "new-lead"
  | "quote-sent"
  | "job-booked"
  | "job-complete"
  | "previous-jobs"
  | "lost";

export interface QuoteRecord {
  id: string;
  type: "Initial" | "Revised" | "Final" | "Manual Deposit";
  amount: number;
  method: "sms" | "email" | "manual";
  target: string;
  date: string;
  status?: "sent" | "paid";
}

export interface InvoiceRecord {
  id: string;
  amount: number;
  method: "sms" | "email" | "manual";
  target?: string;
  status: "sent" | "paid";
  date: string;
}

export interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  title?: string; // e.g. "Day 1", "Installation"
}

export type LeadSource =
  | "Whatsapp"
  | "Checkatrade"
  | "TrustATrader"
  | "SMS"
  | "Email"
  | "Meta"
  | "Google Ads"
  | "Missed Call"
  | "Phone Call"
  | "Manual";

export interface Lead {
  id: string;
  contactId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  value: number;
  status: LeadStatus;
  postcode: string;
  service: string;

  source: LeadSource;
  bookings?: Booking[]; 

  depositStatus: "paid" | "unpaid";
  invoiceStatus: "paid" | "unpaid";

  autoTexted: boolean;
  reviewStatus: "none" | "scheduled" | "sent";
  reviewChannel?: "sms" | "email";
  reviewScheduledDate?: string;

  reviewRating?: string | number;
  reviewSource?: string;
  reviewText?: string;

  createdAt: string;
  jobDate?: string;
  jobEndDate?: string;
  notes?: string;

  // --- NEW: DYNAMIC DATA ---
  jobSpecs?: Record<string, any>; // Stores { "field_123": "2 Vans", "field_456": "Luton" }

  quoteHistory?: QuoteRecord[];
  invoiceHistory?: InvoiceRecord[];
}

// --- THE CUPERTINO PALETTE (FINAL) ---
// Based on Apple Human Interface Guidelines (System Colors)
export const STAGE_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string; iconColor: string; badgeText: string; badgeBg: string }> = {
  'new-lead': { 
    label: 'New Leads', 
    color: 'text-[#007AFF]', // System Blue
    bg: 'bg-[#007AFF]/10', 
    border: 'border-[#007AFF]/20',
    iconColor: '#007AFF',
    badgeText: 'text-[#007AFF]',
    badgeBg: 'bg-[#007AFF]/10'
  },
  'quote-sent': { 
    label: 'Quote Sent', 
    color: 'text-[#FF9500]', // System Orange
    bg: 'bg-[#FF9500]/10', 
    border: 'border-[#FF9500]/20',
    iconColor: '#FF9500',
    badgeText: 'text-[#FF9500]',
    badgeBg: 'bg-[#FF9500]/10'
  },
  'job-booked': { 
    label: 'Job Booked', 
    color: 'text-[#AF52DE]', // System Purple (More distinct than Indigo)
    bg: 'bg-[#AF52DE]/10', 
    border: 'border-[#AF52DE]/20',
    iconColor: '#AF52DE',
    badgeText: 'text-[#AF52DE]',
    badgeBg: 'bg-[#AF52DE]/10'
  },
  'job-complete': { 
    label: 'Job Complete', 
    color: 'text-[#34C759]', // System Green
    bg: 'bg-[#34C759]/10', 
    border: 'border-[#34C759]/20',
    iconColor: '#34C759',
    badgeText: 'text-[#34C759]',
    badgeBg: 'bg-[#34C759]/10'
  },
  'previous-jobs': { 
    label: 'Archive', 
    color: 'text-[#8E8E93]', // System Gray
    bg: 'bg-[#8E8E93]/10', 
    border: 'border-[#8E8E93]/20',
    iconColor: '#8E8E93',
    badgeText: 'text-[#8E8E93]',
    badgeBg: 'bg-[#8E8E93]/10'
  },
  'lost': { 
    label: 'Lost', 
    color: 'text-[#FF3B30]', // System Red
    bg: 'bg-[#FF3B30]/10', 
    border: 'border-[#FF3B30]/20',
    iconColor: '#FF3B30',
    badgeText: 'text-[#FF3B30]',
    badgeBg: 'bg-[#FF3B30]/10'
  }
};

export const COLUMNS: { id: LeadStatus; title: string }[] = [
  { id: "new-lead", title: "New Leads" },
  { id: "quote-sent", title: "Quote Sent" },
  { id: "job-booked", title: "Job Booked" },
  { id: "job-complete", title: "Job Complete" },
  { id: "previous-jobs", title: "Archive" },
];