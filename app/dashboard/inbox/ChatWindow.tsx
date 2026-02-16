'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Phone, Mail, MoreHorizontal, Check, CheckCircle2, 
  MessageCircle, Facebook, Instagram, MapPin, ChevronDown, ChevronUp, X, Loader2, FileText
} from 'lucide-react';
import { Conversation, Message, Channel } from './types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  conversation: Conversation;
}

const getChannelIcon = (channel: Channel) => {
    const c = "w-3.5 h-3.5";
    switch (channel) {
        case 'SMS': return <Phone className={c} />;
        case 'Email': return <Mail className={c} />;
        case 'WhatsApp': return <MessageCircle className={c} />;
        case 'Facebook': return <Facebook className={c} />;
        case 'Instagram': return <Instagram className={c} />;
        case 'Google': return <MapPin className={c} />;
        default: return <Phone className={c} />;
    }
};

const getChannelColor = (channel: Channel) => {
    switch (channel) {
        case 'WhatsApp': return 'text-[#25D366]';
        case 'Facebook': return 'text-[#1877F2]';
        case 'Instagram': return 'text-[#E1306C]';
        case 'Google': return 'text-blue-500';
        case 'Email': return 'text-indigo-500';
        default: return 'text-gray-500';
    }
};

export function ChatWindow({ conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [attachments, setAttachments] = useState<{ url: string, name: string, type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // --- DATA OPTIONS ---
  const dataOptions = (() => {
      const opts: Channel[] = [];
      if (conversation.contactPhone) { opts.push('SMS'); opts.push('WhatsApp'); }
      if (conversation.contactEmail) { opts.push('Email'); }
      if (conversation.channels.includes('Facebook')) opts.push('Facebook');
      if (conversation.channels.includes('Instagram')) opts.push('Instagram');
      if (conversation.channels.includes('Google')) opts.push('Google');
      if (opts.length === 0) { opts.push('SMS'); opts.push('Email'); }
      return Array.from(new Set(opts));
  })();

  const [activeChannel, setActiveChannel] = useState<Channel>(() => {
      if (conversation.type === 'Email' && dataOptions.includes('Email')) return 'Email';
      if (conversation.type === 'WhatsApp' && dataOptions.includes('WhatsApp')) return 'WhatsApp';
      return dataOptions[0] || 'SMS';
  });

  const availableOptions = Array.from(new Set([...dataOptions, activeChannel]));

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/inbox/messages?id=${conversation.id}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversation.id]);

  const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isAtBottomRef.current = isAtBottom;
  };

  useEffect(() => {
    if (scrollRef.current && isAtBottomRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      setIsUploading(true);
      const newFiles = Array.from(e.target.files);
      for (const file of newFiles) {
          try {
              const response = await fetch(`/api/upload?filename=${file.name}`, { method: 'POST', body: file });
              const newBlob = await response.json();
              setAttachments(prev => [...prev, { url: newBlob.url, name: file.name, type: file.type }]);
          } catch (error) { console.error("Upload failed", error); }
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    setSending(true);
    isAtBottomRef.current = true;

    const tempId = Date.now().toString();
    const newMessage: Message = {
        id: tempId,
        body: input,
        direction: 'outbound',
        status: 'pending',
        date: new Date().toISOString(),
        channel: activeChannel,
        attachments: attachments.map(a => a.url)
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setAttachments([]);

    try {
        const res = await fetch('/api/inbox/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contactId: conversation.contactId,
                message: newMessage.body,
                channel: activeChannel,
                phone: conversation.contactPhone,
                email: conversation.contactEmail,
                subject: "New Message",
                attachments: newMessage.attachments
            })
        });
        if (!res.ok) throw new Error("API Failed");
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (error) {
        console.error("Send failed", error);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    } finally {
        setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* HEADER (Glassmorphism) */}
      <div className="h-16 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-xl z-20 border-b border-gray-100 sticky top-0">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-inner border border-white">
                {conversation.initials}
            </div>
            <div className="flex flex-col">
                <h2 className="text-sm font-bold text-[#1D1D1F] tracking-tight leading-none">{conversation.contactName}</h2>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1">
                    {getChannelIcon(conversation.type)}
                    <span>{conversation.type}</span>
                </div>
            </div>
        </div>
        
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#1D1D1F] hover:bg-gray-50 rounded-full transition-all cursor-pointer border-none outline-none">
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* MESSAGES AREA */}
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-2 bg-white relative"
      >
        {messages.map((msg, idx) => {
            const isMe = msg.direction === 'outbound';
            const prevMsg = messages[idx - 1];
            const nextMsg = messages[idx + 1];
            
            const isSameSenderAsPrev = prevMsg && prevMsg.direction === msg.direction;
            const isSameSenderAsNext = nextMsg && nextMsg.direction === msg.direction;
            const showDate = idx === 0 || new Date(msg.date).toDateString() !== new Date(prevMsg.date).toDateString();

            // iMessage Bubble Logic
            let roundedClass = 'rounded-[20px]';
            if (isMe) {
                if (isSameSenderAsPrev && isSameSenderAsNext) roundedClass = 'rounded-[20px] rounded-r-[4px]';
                else if (isSameSenderAsPrev) roundedClass = 'rounded-[20px] rounded-tr-[4px]';
                else if (isSameSenderAsNext) roundedClass = 'rounded-[20px] rounded-br-[4px]';
            } else {
                if (isSameSenderAsPrev && isSameSenderAsNext) roundedClass = 'rounded-[20px] rounded-l-[4px]';
                else if (isSameSenderAsPrev) roundedClass = 'rounded-[20px] rounded-tl-[4px]';
                else if (isSameSenderAsNext) roundedClass = 'rounded-[20px] rounded-bl-[4px]';
            }

            return (
                <div key={msg.id} className="relative z-10">
                    {showDate && (
                        <div className="flex justify-center my-6">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                {new Date(msg.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                        <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            
                            {/* ATTACHMENTS */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`flex flex-wrap gap-2 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {msg.attachments.map((url, i) => {
                                        if (!url) return null;
                                        const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                                        return isImg ? (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                <img src={url} alt="Attachment" className="max-w-[200px] max-h-[200px] object-cover" />
                                            </a>
                                        ) : (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs font-medium text-gray-700 underline">View File</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}

                            {/* TEXT BUBBLE (iMessage Style) */}
                            {msg.body.trim() && (
                                <div className={`px-4 py-2.5 text-[14px] leading-relaxed shadow-sm break-words whitespace-pre-wrap
                                    ${roundedClass}
                                    ${isMe 
                                        ? 'bg-gradient-to-b from-[#007AFF] to-[#0062cc] text-white' 
                                        : 'bg-[#E9E9EB] text-[#1D1D1F]'
                                    }`}
                                >
                                    {msg.body}
                                </div>
                            )}
                            
                            {/* STATUS INDICATOR (Only for last message in block) */}
                            {!isSameSenderAsNext && isMe && (
                                <div className="flex items-center gap-1 mt-1 mr-1">
                                    <span className="text-[10px] font-medium text-gray-400">
                                        {msg.status === 'read' ? 'Read' : 'Delivered'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            );
        })}
      </div>

      {/* INPUT DOCK (Floating) */}
      <div className="p-4 bg-white shrink-0 z-20">
        <div className="max-w-4xl mx-auto relative">
            
            {/* ATTACHMENT PREVIEW */}
            {attachments.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 flex gap-2 overflow-x-auto max-w-full p-1 z-30">
                    {attachments.map((file, i) => (
                        <div key={i} className="relative bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 min-w-[140px]">
                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 truncate w-16">{file.name}</span>
                            <button onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full p-0.5 shadow-md border border-gray-100 cursor-pointer"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-[#F2F2F7] rounded-[24px] border border-transparent focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-lg focus-within:shadow-gray-200/50 transition-all duration-200 p-1.5 flex items-end gap-2">
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2 text-gray-400 hover:text-[#007AFF] hover:bg-gray-200/50 rounded-full transition-colors border-none outline-none cursor-pointer shrink-0 mb-0.5"
                >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" /> : <Paperclip className="w-5 h-5" />}
                </button>
                
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />

                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`iMessage via ${activeChannel}`}
                    className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#1D1D1F] placeholder-gray-400 resize-none max-h-32 py-2.5 px-1 min-h-[40px] focus:ring-0"
                    style={{ height: '40px' }}
                />

                <div className="flex items-center gap-2 mb-0.5">
                    <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wide select-none border border-gray-200 cursor-pointer transition-colors shadow-sm"
                        >
                            <span className={getChannelColor(activeChannel)}>{getChannelIcon(activeChannel)}</span>
                            {isMenuOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] p-1"
                                >
                                    {availableOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => { setActiveChannel(opt); setIsMenuOpen(false); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors border-none outline-none cursor-pointer
                                                ${activeChannel === opt ? 'bg-gray-100 text-[#1D1D1F]' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            <span className={getChannelColor(opt)}>{getChannelIcon(opt)}</span>
                                            {opt}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && attachments.length === 0) || sending}
                        className="w-8 h-8 bg-[#007AFF] hover:bg-[#0062cc] text-white rounded-full flex items-center justify-center shadow-md transition-all disabled:opacity-50 disabled:shadow-none transform active:scale-95 border-none outline-none cursor-pointer"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}