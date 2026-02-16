'use client';

import { useDroppable } from '@dnd-kit/core';
import { Lead, LeadStatus, STAGE_CONFIG } from './data';
import { Card } from './Card';
import { motion } from 'framer-motion';

interface ColumnProps {
  id: LeadStatus;
  title: string;
  leads: Lead[];
  totalValue: number;
  onCardClick?: (lead: Lead) => void;
}

export function Column({ id, title, leads, totalValue, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = STAGE_CONFIG[id];

  return (
    <div className="flex flex-col h-full w-full relative group">
      
      {/* GLASS HEADER */}
      <div className="flex flex-col pb-3 mb-2 sticky top-0 z-10 bg-[#F9FAFB]/90 backdrop-blur-md border-b border-gray-200/50 transition-colors">
        
        {/* COLOR BAR (Top Accent) */}
        <div 
            className="absolute top-0 left-0 w-full h-[3px] rounded-full opacity-80" 
            style={{ backgroundColor: config.iconColor }} 
        />
        
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#1D1D1F] text-[13px] tracking-tight">{title}</h3>
            <span className="bg-gray-200/60 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {leads.length}
            </span>
          </div>
          
          {/* TOTAL VALUE */}
          {totalValue > 0 && (
              <div className="text-[11px] font-bold text-gray-500 tabular-nums">
                £{totalValue.toLocaleString()}
              </div>
          )}
        </div>
      </div>

      {/* DROP ZONE */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 overflow-y-auto px-0.5 pb-20 transition-colors duration-300 space-y-3 custom-scrollbar
            ${isOver ? 'bg-gray-100/50 rounded-xl' : ''}`}
      >
        {leads.map((lead) => (
          <Card key={lead.id} lead={lead} onClick={() => onCardClick && onCardClick(lead)} />
        ))}
        
        {leads.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-gray-300 text-xs font-medium border-2 border-dashed border-gray-200 rounded-2xl mt-2">
                <span className="opacity-50">No Leads</span>
            </div>
        )}
      </div>
    </div>
  );
}