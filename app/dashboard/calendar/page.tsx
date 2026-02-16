'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { enGB } from 'date-fns/locale/en-GB';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';
import { JobTicketModal } from '../ActionModals';
import { Lead, STAGE_CONFIG } from '../data';
import { Modal } from '../Modal';
import { LoadingScreen } from '../components/LoadingScreen';
import { CustomToolbar } from './components/CustomToolbar';
import { YearView } from './components/YearView';
import { DayOverviewModal } from './components/DayOverviewModal';
import { AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

const locales = { 'en-GB': enGB };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// --- CUSTOM EVENT (WEEK/DAY ONLY) ---
const CustomEvent = ({ event, view }: any) => {
    const lead = event.resource as Lead;
    if (view === 'month') return null;

    const config = STAGE_CONFIG[lead.status] || STAGE_CONFIG['new-lead'];

    return (
        <div 
            className="h-full w-full p-2 rounded-lg border-l-[3px] flex flex-col gap-0.5 overflow-hidden shadow-sm transition-all hover:shadow-md"
            style={{ 
                backgroundColor: config.bg.replace('/50', '/80'), // Slightly more opaque
                borderColor: config.iconColor,
                color: config.iconColor
            }}
        >
            <div className="font-bold text-[11px] truncate text-[#1D1D1F]">{lead.firstName} {lead.lastName}</div>
            <div className="text-[10px] font-medium opacity-80 truncate text-gray-600">{lead.service}</div>
            <div className="flex items-center gap-1 text-[9px] opacity-70 mt-auto text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{lead.postcode?.split(' ')[0]}</span>
            </div>
        </div>
    );
};

export default function CalendarPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [viewingTicketLead, setViewingTicketLead] = useState<Lead | null>(null);
  
  const [dayModal, setDayModal] = useState<{ isOpen: boolean, date: Date | null, events: any[] }>({
    isOpen: false, date: null, events: []
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (error) {
      console.error("Failed to fetch leads", error);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const events = leads
    .filter(l => l.jobDate)
    .map(l => ({
        title: `${l.firstName} ${l.lastName}`,
        start: new Date(l.jobDate!),
        end: l.jobEndDate ? new Date(l.jobEndDate) : new Date(new Date(l.jobDate!).getTime() + 60 * 60 * 1000),
        resource: l
    }));

  const stats = useMemo(() => {
    let start = startOfMonth(date);
    let end = endOfMonth(date);

    if (view === 'year') { start = startOfYear(date); end = endOfYear(date); }
    else if (view === 'month') { start = startOfMonth(date); end = endOfMonth(date); }
    else if (view === 'week') { start = startOfWeek(date, { weekStartsOn: 1 }); end = endOfWeek(date, { weekStartsOn: 1 }); }
    else if (view === 'day') { start = startOfDay(date); end = endOfDay(date); }

    const visibleEvents = events.filter(e => isWithinInterval(e.start, { start, end }));

    return {
        count: visibleEvents.length,
        value: visibleEvents.reduce((sum, e) => sum + (e.resource.value || 0), 0)
    };
  }, [events, view, date]);

  const handleSaveLead = async (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(null);
    try {
        await fetch('/api/leads/update', { method: 'PUT', body: JSON.stringify(updatedLead) });
    } catch (error) { console.error("Save failed", error); fetchLeads(); }
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (view === Views.MONTH) {
        const dayEvents = events.filter(e => isSameDay(e.start, slotInfo.start));
        setDayModal({ isOpen: true, date: slotInfo.start, events: dayEvents });
    }
  };

  const handleYearDayClick = useCallback((day: Date, dayEvents: any[]) => {
      setDayModal({ isOpen: true, date: day, events: dayEvents });
  }, []);

  // --- CUSTOM MONTH CELL (THE QUINTILLION DOLLAR UI) ---
  const MonthDateHeader = ({ date, label }: { date: Date, label: string }) => {
    const dayEvents = events.filter(e => isSameDay(e.start, date));
    const totalValue = dayEvents.reduce((sum, e) => sum + (e.resource.value || 0), 0);
    const isToday = isSameDay(date, new Date());
    const hasEvents = dayEvents.length > 0;

    return (
        <div className="flex flex-col h-full w-full">
            {/* Date Number */}
            <span className={`text-sm font-bold mb-2 ${isToday ? 'text-[#FF3B30]' : 'text-[#1D1D1F]'}`}>
                {label}
            </span>

            {/* Summary Stats */}
            {hasEvents && (
                <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F]" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                            {dayEvents.length} {dayEvents.length === 1 ? 'Job' : 'Jobs'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 tracking-tight">
                            £{totalValue.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const { views, components } = useMemo(() => {
    const YearViewWrapper = (props: any) => (
        <YearView {...props} onDayClick={handleYearDayClick} />
    );
    YearViewWrapper.range = YearView.range;
    YearViewWrapper.title = YearView.title;
    YearViewWrapper.navigate = YearView.navigate;

    return {
        views: { 
            month: true, 
            week: true, 
            day: true, 
            year: YearViewWrapper 
        },
        components: {
            toolbar: (props: any) => <CustomToolbar {...props} stats={stats} />,
            event: (props: any) => <CustomEvent {...props} view={view} />,
            month: {
                dateHeader: MonthDateHeader,
            }
        }
    };
  }, [events, stats, view, handleYearDayClick]);

  return (
    <div className="h-full flex flex-col pt-6 px-4 md:px-8 bg-[#F9FAFB]">
      <AnimatePresence>
          {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <div className="flex-1 h-[calc(100vh-100px)] bg-white rounded-[32px] p-6 shadow-sm border border-gray-200/60">
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={views}
            view={view} 
            onView={setView}
            date={date} 
            onNavigate={setDate} 
            defaultView={Views.MONTH}
            components={components as any}
            culture="en-GB"
            
            onDrillDown={() => {}} 
            onSelectEvent={(event) => setViewingTicketLead(event.resource)}
            selectable={true} 
            onSelectSlot={handleSelectSlot} 
        />
      </div>

      <Modal 
          isOpen={!!selectedLead} 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          onSave={handleSaveLead} 
      />

      <DayOverviewModal 
        isOpen={dayModal.isOpen}
        onClose={() => setDayModal({ ...dayModal, isOpen: false })}
        date={dayModal.date}
        events={dayModal.events}
        onEventClick={(lead) => {
            setDayModal({ ...dayModal, isOpen: false });
            setViewingTicketLead(lead); 
        }}
      />

      {viewingTicketLead && (
          <JobTicketModal 
            isOpen={!!viewingTicketLead} 
            onClose={() => setViewingTicketLead(null)} 
            lead={viewingTicketLead} 
          />
      )}
    </div>
  );
}