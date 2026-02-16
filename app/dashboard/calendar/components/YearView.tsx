'use client';

import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, setMonth } from 'date-fns';
import { STAGE_CONFIG } from '../../data';

interface YearViewProps {
  date: Date;
  events: any[];
  onNavigate: (date: Date) => void;
  onView: (view: any) => void;
  onDayClick: (date: Date, events: any[]) => void;
}

export function YearView({ date, events, onDayClick }: YearViewProps) {
  const year = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);

  const getEventsForDay = (day: Date) => {
    return events.filter(e => isSameDay(e.start, day));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-12 p-6 overflow-y-auto h-full custom-scrollbar">
      {months.map((monthIndex) => {
        const currentMonth = setMonth(new Date(year, 0, 1), monthIndex);
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
          <div key={monthIndex} className="flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="text-sm font-bold text-[#1D1D1F]">
                    {format(currentMonth, 'MMMM')}
                </h3>
            </div>

            <div className="grid grid-cols-7 gap-y-3 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}

              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const dayEvents = getEventsForDay(day);
                const hasEvents = dayEvents.length > 0;
                const isToday = isSameDay(day, new Date());
                
                let dotColor = 'bg-blue-500';
                if (hasEvents) {
                    const status = dayEvents[0].resource.status;
                    // Use STAGE_CONFIG colors if available, else default
                    if (status === 'job-booked') dotColor = 'bg-indigo-500';
                    else if (status === 'quote-sent') dotColor = 'bg-orange-500';
                    else if (status === 'job-complete') dotColor = 'bg-emerald-500';
                }

                return (
                  <div 
                    key={idx} 
                    onClick={() => hasEvents && onDayClick(day, dayEvents)}
                    className={`relative h-8 flex items-center justify-center text-xs rounded-full transition-all
                      ${!isCurrentMonth ? 'opacity-0 pointer-events-none' : ''}
                      ${isToday 
                        ? 'bg-[#FF3B30] text-white font-bold shadow-md' 
                        : hasEvents 
                            ? 'text-[#1D1D1F] font-semibold cursor-pointer hover:bg-gray-100' 
                            : 'text-gray-500'
                      }
                    `}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasEvents && !isToday && (
                      <div className={`absolute bottom-1 w-1 h-1 rounded-full ${dotColor}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

YearView.range = (date: Date) => [startOfMonth(date), endOfMonth(date)];
YearView.title = (date: Date) => format(date, 'yyyy');
YearView.navigate = (date: Date, action: string) => {
    if (action === 'PREV') return addMonths(date, -12);
    if (action === 'NEXT') return addMonths(date, 12);
    return date;
};