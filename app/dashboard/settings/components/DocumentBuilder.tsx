'use client';

import { useState, useRef, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Type, Hash, Calendar, List, AlignLeft, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'textarea';

export interface CustomField {
  id: string;
  label: string;
  type: FieldType;
  options?: string;
  placeholder?: string;
}

interface DocumentBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

function QuintillionSelect({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { value: string, label: string, icon: React.ReactNode }[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={containerRef} className="relative h-10" onMouseDown={(e) => e.stopPropagation()}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-full bg-[#F5F5F7] hover:bg-white border border-transparent hover:border-gray-200 rounded-xl px-3 flex items-center justify-between cursor-pointer transition-all
                ${isOpen ? 'bg-white border-[#5856D6]/30 ring-2 ring-[#5856D6]/10' : ''}`}
            >
                <div className="flex items-center gap-2">
                    {selected?.icon && <span className="text-gray-400">{selected.icon}</span>}
                    <span className="text-[13px] font-medium text-[#1D1D1F]">{selected?.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5856D6]' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-1"
                    >
                        {options.map((opt) => (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                className={`px-3 py-2 text-[13px] font-medium cursor-pointer rounded-lg transition-colors flex items-center justify-between
                                    ${value === opt.value ? 'bg-[#5856D6]/10 text-[#5856D6]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={value === opt.value ? 'text-[#5856D6]' : 'text-gray-400'}>{opt.icon}</span>
                                    {opt.label}
                                </div>
                                {value === opt.value && <Check className="w-3.5 h-3.5 text-[#5856D6]" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SortableField({ field, onRemove, onUpdate }: { 
    field: CustomField, 
    onRemove: (id: string) => void,
    onUpdate: (id: string, updates: Partial<CustomField>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-start gap-4 group hover:border-gray-300 transition-colors shadow-sm">
      <button {...attributes} {...listeners} className="mt-2.5 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none outline-none border-none bg-transparent">
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Field Label</label>
              <input 
                value={field.label}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                placeholder="e.g. Number of Vans"
                className="w-full h-10 px-3 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#5856D6]/20 transition-all"
              />
          </div>

          <div className="md:col-span-3">
              <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Data Type</label>
              <QuintillionSelect 
                  value={field.type}
                  onChange={(val) => onUpdate(field.id, { type: val as FieldType })}
                  options={[
                      { value: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
                      { value: 'number', label: 'Number', icon: <Hash className="w-3.5 h-3.5" /> },
                      { value: 'date', label: 'Date & Time', icon: <Calendar className="w-3.5 h-3.5" /> },
                      { value: 'dropdown', label: 'Dropdown', icon: <List className="w-3.5 h-3.5" /> },
                      { value: 'textarea', label: 'Long Text', icon: <AlignLeft className="w-3.5 h-3.5" /> },
                  ]}
              />
          </div>

          <div className="md:col-span-5">
              {field.type === 'dropdown' ? (
                  <>
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Options (Comma Separated)</label>
                    <input 
                        value={field.options || ''}
                        onChange={(e) => onUpdate(field.id, { options: e.target.value })}
                        placeholder="e.g. Luton, Transit, LWB"
                        className="w-full h-10 px-3 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#5856D6]/20 transition-all"
                    />
                  </>
              ) : (
                  <>
                    <label className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wide mb-2 block">Placeholder (Optional)</label>
                    <input 
                        value={field.placeholder || ''}
                        onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                        placeholder="e.g. Enter value..."
                        className="w-full h-10 px-3 bg-[#F5F5F7] rounded-xl border-none outline-none text-[13px] font-medium text-[#1D1D1F] focus:bg-white focus:ring-2 focus:ring-[#5856D6]/20 transition-all"
                    />
                  </>
              )}
          </div>
      </div>

      <button 
        onClick={() => onRemove(field.id)}
        className="mt-2.5 p-2 text-gray-300 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors outline-none border-none bg-transparent cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function DocumentBuilder({ fields, onChange }: DocumentBuilderProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const addField = () => {
      const newField: CustomField = { id: `field_${Date.now()}`, label: '', type: 'text', placeholder: '' };
      onChange([...fields, newField]);
  };

  const removeField = (id: string) => onChange(fields.filter(f => f.id !== id));
  const updateField = (id: string, updates: Partial<CustomField>) => onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));

  return (
    <div className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {fields.map((field) => (
                        <SortableField key={field.id} field={field} onRemove={removeField} onUpdate={updateField} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>

        <button 
            onClick={addField}
            className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-400 font-bold text-xs hover:border-[#5856D6] hover:text-[#5856D6] hover:bg-[#5856D6]/5 transition-all flex items-center justify-center gap-2 outline-none bg-transparent cursor-pointer"
        >
            <Plus className="w-4 h-4" /> Add Custom Field
        </button>
    </div>
  );
}