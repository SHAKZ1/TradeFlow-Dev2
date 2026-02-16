export type Channel = 
  | 'All' 
  | 'SMS' 
  | 'Email' 
  | 'WhatsApp' 
  | 'Facebook' 
  | 'Instagram' 
  | 'Checkatrade' 
  | 'TrustATrader' 
  | 'Google';

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  lastMessageBody: string;
  lastMessageDate: string;
  unreadCount: number;
  channels: Channel[]; // Active channels in history
  tags: string[];
  initials: string;
  type: Channel; // Primary type
}

export interface Message {
  id: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  date: string;
  channel: Channel;
  attachments?: string[];
}

export const CHANNEL_FILTERS: { id: Channel; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'SMS', label: 'SMS' },
  { id: 'Email', label: 'Email' },
  { id: 'WhatsApp', label: 'WhatsApp' },
  { id: 'Facebook', label: 'Messenger' },
  { id: 'Instagram', label: 'Instagram' },
  { id: 'Google', label: 'Google Business' },
  { id: 'Checkatrade', label: 'Checkatrade' },
  { id: 'TrustATrader', label: 'TrustATrader' },
];