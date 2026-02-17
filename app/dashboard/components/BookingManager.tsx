'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from '../data';
import { format, isSameDay } from 'date-fns';
import { AlertModal } from '../AlertModal'; // <--- Import Custom Modal

interface BookingManagerProps {
  bookings: Booking[];
  onChange: (bookings: Booking[]) => void;
}

// Helper for Date Inputs
function DateInput({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
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
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
}

export function BookingManager({ bookings, onChange }: BookingManagerProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [duration, setDuration] = useState('');
  const [overlapWarning, setOverlapWarning] = useState(false);
  
  // State for the custom modal
  const [isOverlapModalOpen, setIsOverlapModalOpen] = useState(false);

  // --- DURATION & AUTO-END LOGIC ---
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (!value) return;
    const dateObj = new Date(value);
    const isoString = dateObj.toISOString();

    if (type === 'start') {
        setStart(isoString.slice(0, 16)); // Keep local format for input
        
        // Auto-adjust end if duration exists
        if (duration) {
            const newEnd = new Date(dateObj.getTime() + (parseFloat(duration) * 3600000));
            setEnd(newEnd.toISOString().slice(0, 16));
        } else if (end) {
            // Recalculate duration if end exists
            const endDate = new Date(end);
            if (endDate > dateObj) {
                const diff = (endDate.getTime() - dateObj.getTime()) / 3600000;
                setDuration(diff.toFixed(1));
            }
        }
    } else {
        setEnd(isoString.slice(0, 16));
        if (start) {
            const startDate = new Date(start);
            if (dateObj > startDate) {
                const diff = (dateObj.getTime() - startDate.getTime()) / 3600000;
                setDuration(diff.toFixed(1));
            }
        }
    }
  };

  const handleDurationChange = (val: string) => {
    setDuration(val);
    const hours = parseFloat(val);
    if (start && !isNaN(hours)) {
        const s = new Date(start);
        const e = new Date(s.getTime() + (hours * 3600000));
        const offset = e.getTimezoneOffset() * 60000;
        setEnd(new Date(e.getTime() - offset).toISOString().slice(0, 16));
    }
  };

  // --- OVERLAP DETECTION ---
  useEffect(() => {
    if (!start || !end) {
        setOverlapWarning(false);
        return;
    }
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    const hasOverlap = bookings.some(b => {
        const bStart = new Date(b.startDate).getTime();
        const bEnd = new Date(b.endDate).getTime();
        return (s < bEnd && e > bStart);
    });

    setOverlapWarning(hasOverlap);
  }, [start, end, bookings]);

  // --- ADD LOGIC ---
  const initiateAdd = () => {
    if (!start || !end) return;
    
    if (overlapWarning) {
        setIsOverlapModalOpen(true); // Trigger custom modal
        return;
    }
    
    executeAdd();
  };

  const executeAdd = () => {
    const newBooking: Booking = {
        id: Date.now().toString(),
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        title: `Booking ${bookings.length + 1}`
    };

    onChange([...bookings, newBooking]);
    
    // Reset form
    setStart('');
    setEnd('');
    setDuration('');
    setIsOverlapModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(bookings.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-8">
        
        {/* 1. ADD BOOKING FORM */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Add Session</h4>
                {overlapWarning && (
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100"
                    >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">Overlap Detected</span>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <DateInput label="Start" value={start} onChange={(v) => handleDateChange('start', v)} />
                <DateInput label="End" value={end} onChange={(v) => handleDateChange('end', v)} />
            </div>

            <div className="flex items-end gap-4">
                <div className="w-32">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block ml-1">Duration (Hrs)</label>
                    <div className="relative bg-[#F5F5F7] rounded-xl border border-transparent hover:border-gray-200 focus-within:bg-white focus-within:shadow-sm focus-within:border-gray-200 transition-all flex items-center px-3 h-[46px]">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <input 
                            type="number" 
                            value={duration} 
                            onChange={(e) => handleDurationChange(e.target.value)} 
                            className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-900" 
                            placeholder="0" 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={initiateAdd}
                    disabled={!start || !end}
                    className={`flex-1 h-[46px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm border-none outline-none cursor-pointer
                        ${!start || !end 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : overlapWarning 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                                : 'bg-[#1D1D1F] hover:bg-black text-white shadow-gray-200'}`}
                >
                    <Plus className="w-4 h-4" />
                    {overlapWarning ? 'Add Anyway' : 'Add Booking'}
                </button>
            </div>
        </div>

        {/* 2. BOOKING LIST */}
        <div>
            <div className="flex justify-between items-end mb-3 px-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scheduled Sessions</h4>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{bookings.length}</span>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {bookings.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400 font-medium">No sessions scheduled yet.</p>
                        </div>
                    ) : (
                        bookings
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((booking) => {
                            const startD = new Date(booking.startDate);
                            const endD = new Date(booking.endDate);
                            const isSame = isSameDay(startD, endD);
                            
                            return (
                                <motion.div 
                                    key={booking.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between group hover:border-gray-300 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Date Badge */}
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#F5F5F7] rounded-xl border border-gray-200">
                                            <span className="text-[9px] font-bold text-red-500 uppercase">{format(startD, 'MMM')}</span>
                                            <span className="text-lg font-bold text-gray-900 leading-none">{format(startD, 'd')}</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {format(startD, 'EEEE')}
                                                </span>
                                                {/* Status Dot (Green if future, Gray if past) */}
                                                <div className={`w-1.5 h-1.5 rounded-full ${startD > new Date() ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(startD, 'HH:mm')}</span>
                                                <span className="text-gray-300">-</span>
                                                <span>{format(endD, 'HH:mm')}</span>
                                                {!isSame && <span className="text-gray-400 italic"> (+1d)</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* FIXED DELETE BUTTON */}
                                    <button 
                                        onClick={() => handleDelete(booking.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border-none outline-none cursor-pointer"
                                        title="Remove Booking"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* CUSTOM OVERLAP MODAL */}
        <AlertModal 
            isOpen={isOverlapModalOpen}
            type="warning"
            title="Schedule Conflict"
            message="This booking overlaps with an existing session. Do you want to double-book this slot?"
            confirmText="Add Anyway"
            cancelText="Cancel"
            onClose={() => setIsOverlapModalOpen(false)}
            onConfirm={executeAdd}
        />
    </div>
  );
}