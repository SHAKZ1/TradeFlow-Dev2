'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Mail, Phone, MessageCircle, Facebook, Instagram, MapPin, Inbox as InboxIcon } from 'lucide-react';
import { CHANNEL_FILTERS, Channel, Conversation } from './types';
import { ChatWindow } from './ChatWindow';
import { LoadingScreen } from '../components/LoadingScreen';

const getChannelIcon = (channel: Channel) => {
    const classes = "w-3 h-3";
    switch (channel) {
        case 'SMS': return <Phone className={classes} />;
        case 'Email': return <Mail className={classes} />;
        case 'WhatsApp': return <MessageCircle className={classes} />;
        case 'Facebook': return <Facebook className={classes} />;
        case 'Instagram': return <Instagram className={classes} />;
        case 'Google': return <MapPin className={classes} />;
        default: return null;
    }
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Channel>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/inbox/conversations');
      if (!res.ok) throw new Error("API Route Not Found");
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch (error) {
      console.error("Failed to load inbox", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter(c => {
      if (activeFilter === 'All') return true;
      return c.channels.includes(activeFilter);
  });

  return (
    <div className="h-[calc(100vh-100px)] -m-4 md:-m-8 flex bg-[#F5F5F7] overflow-hidden">
      
      {/* LEFT PANE: LIST (Finder Style) */}
      <div className="w-[360px] flex flex-col border-r border-gray-200/60 bg-[#F5F5F7] shrink-0">
        
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-4 shrink-0">
            <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">Messages</h1>
            <button onClick={() => fetchConversations()} className="p-2 text-gray-400 hover:text-[#1D1D1F] transition-colors border-none outline-none cursor-pointer">
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>

        {/* SEARCH */}
        <div className="px-4 pb-4">
            <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full h-9 pl-9 pr-4 bg-[#E3E3E8] rounded-lg text-[13px] font-medium text-[#1D1D1F] border-none outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all placeholder-gray-500"
                />
            </div>
        </div>

        {/* FILTERS */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
            {CHANNEL_FILTERS.map((filter) => (
                <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all border-none outline-none cursor-pointer
                        ${activeFilter === filter.id 
                            ? 'bg-[#007AFF] text-white shadow-sm' 
                            : 'bg-transparent text-gray-500 hover:bg-gray-200/50'}`}
                >
                    {filter.label}
                </button>
            ))}
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-1">
            {isLoading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading...</div>
            ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No messages found.</div>
            ) : (
                filteredConversations.map((conv) => (
                    <div 
                        key={conv.id}
                        onClick={() => setSelectedId(conv.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all group relative
                            ${selectedId === conv.id 
                                ? 'bg-white shadow-sm ring-1 ring-black/5' 
                                : 'hover:bg-gray-200/50'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                                {conv.unreadCount > 0 && (
                                    <div className="w-2 h-2 rounded-full bg-[#007AFF] shrink-0" />
                                )}
                                <h4 className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'font-bold text-[#1D1D1F]' : 'font-semibold text-[#1D1D1F]'}`}>
                                    {conv.contactName}
                                </h4>
                            </div>
                            <span className={`text-[11px] whitespace-nowrap ${conv.unreadCount > 0 ? 'text-[#007AFF] font-medium' : 'text-gray-400'}`}>
                                {new Date(conv.lastMessageDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        
                        <p className={`text-[12px] truncate leading-snug ${conv.unreadCount > 0 ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                            {conv.lastMessageBody}
                        </p>
                        
                        {/* ICONS */}
                        <div className="flex gap-1.5 mt-2 opacity-60">
                            {conv.channels.map(channel => (
                                <div key={channel} className="text-gray-400">
                                    {getChannelIcon(channel)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* RIGHT PANE: CHAT WINDOW */}
      <div className="flex-1 bg-white relative flex flex-col overflow-hidden shadow-[-1px_0_0_rgba(0,0,0,0.05)] z-10">
          {selectedId ? (
              (() => {
                  const selectedConv = conversations.find(c => c.id === selectedId);
                  if (!selectedConv) return <div>Error loading chat</div>;
                  return <ChatWindow conversation={selectedConv} />;
              })()
          ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-300">
                  <div className="w-24 h-24 rounded-[32px] bg-gray-50 flex items-center justify-center">
                      <InboxIcon className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No Message Selected</p>
              </div>
          )}
      </div>

    </div>
  );
}