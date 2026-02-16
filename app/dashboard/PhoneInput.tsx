'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { usePhoneInput } from 'react-international-phone';
import { PhoneNumberUtil } from 'google-libphonenumber';
import 'react-international-phone/style.css';
import { ChevronDown, Check, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const phoneUtil = PhoneNumberUtil.getInstance();

const ELITE_COUNTRIES = [
  ['United Kingdom', 'gb', '44'],
  ['United States', 'us', '1'],
  ['Canada', 'ca', '1'],
  ['Australia', 'au', '61'],
  ['Ireland', 'ie', '353'],
  ['Germany', 'de', '49'],
  ['France', 'fr', '33'],
  ['Spain', 'es', '34'],
  ['Italy', 'it', '39'],
  ['Netherlands', 'nl', '31'],
  ['Poland', 'pl', '48'],
  ['Portugal', 'pt', '351'],
  ['Sweden', 'se', '46'],
  ['Norway', 'no', '47'],
  ['Denmark', 'dk', '45'],
  ['Finland', 'fi', '358'],
  ['Belgium', 'be', '32'],
  ['Austria', 'at', '43'],
  ['Switzerland', 'ch', '41'],
  ['New Zealand', 'nz', '64'],
  ['South Africa', 'za', '27'],
  ['United Arab Emirates', 'ae', '971'],
];

interface ElitePhoneInputProps {
  value: string;
  onChange: (phone: string, isValid: boolean) => void;
  error?: boolean;
}

export const validatePhone = (phone: string) => {
  try {
    return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
  } catch (error) {
    return false;
  }
};

export function ElitePhoneInput({ value, onChange, error }: ElitePhoneInputProps) {
  const isValid = validatePhone(value);

  const { country, setCountry, inputValue, handlePhoneValueChange } = usePhoneInput({
    defaultCountry: 'gb',
    value,
    countries: ELITE_COUNTRIES as any,
    forceDialCode: true,
    onChange: (data) => {
        let cleanPhone = data.phone;
        const dialCode = data.country.dialCode;
        if (cleanPhone.startsWith(`+${dialCode}0`)) {
            cleanPhone = `+${dialCode}${cleanPhone.slice(dialCode.length + 2)}`;
        }
        const digitsOnly = cleanPhone.replace(/\D/g, '');
        if (digitsOnly.length > 15) return; 
        const valid = validatePhone(cleanPhone);
        onChange(cleanPhone, valid);
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return ELITE_COUNTRIES.filter(c => 
        c[0].toLowerCase().includes(q) || 
        c[1].toLowerCase().includes(q) || 
        c[2].includes(q) ||               
        `+${c[2]}`.includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* MAIN INPUT CONTAINER (UPDATED STYLING) */}
      <div 
        className={`h-10 bg-[#F5F5F7] rounded-xl flex items-center transition-all duration-200 relative
        ${error 
            ? 'ring-2 ring-red-100 bg-red-50/30' 
            : 'focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20'
        }`}
      >
        
        {/* TRIGGER AREA */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-full pl-3 pr-2 flex items-center gap-2 hover:bg-gray-200/50 transition-colors outline-none border-none bg-transparent cursor-pointer group/trigger shrink-0 rounded-l-xl"
        >
          <img 
            src={`https://flagcdn.com/w40/${country.iso2}.png`} 
            alt={country.name}
            className="w-5 h-auto rounded-[2px] object-cover shadow-sm ring-1 ring-black/5"
          />
          <span className="text-[13px] font-medium text-[#1D1D1F] group-hover/trigger:text-black transition-colors">
            +{country.dialCode}
          </span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#007AFF]' : ''}`} />
        </button>

        {/* SEPARATOR */}
        <div className="h-5 w-[1px] bg-gray-300/50 mx-1 shrink-0" />

        {/* THE INPUT */}
        <input
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          className="flex-1 h-full bg-transparent px-3 pr-10 text-[13px] font-medium text-[#1D1D1F] placeholder-gray-400 outline-none border-none w-full"
          placeholder="7000 000 000"
        />

        {/* VALIDATION ICON */}
        <div className="absolute right-3 top-0 h-full flex items-center justify-center pointer-events-none">
            {isValid ? (
                <Check className="w-4 h-4 text-[#34C759]" />
            ) : (
                value.length > 5 && <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
            )}
        </div>
      </div>

      {/* ELITE DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-[320px] max-h-[350px] bg-white rounded-xl shadow-2xl ring-1 ring-black/5 z-50 flex flex-col overflow-hidden"
          >
            {/* SEARCH BAR */}
            <div className="p-3 border-b border-gray-50 bg-white sticky top-0 z-10">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input 
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search country or code..."
                        className="w-full bg-[#F5F5F7] border-none rounded-lg pl-9 pr-3 py-2 text-[13px] font-medium text-[#1D1D1F] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 outline-none transition-all"
                    />
                </div>
            </div>

            {/* COUNTRY LIST */}
            <div className="overflow-y-auto flex-1 p-1 elite-scroll">
                {filteredCountries.length > 0 ? (
                    filteredCountries.map((c) => (
                    <button
                        key={c[1]} 
                        onClick={() => {
                            setCountry(c[1]);
                            setIsOpen(false);
                            setSearchQuery('');
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 border-none outline-none cursor-pointer
                        ${country.iso2 === c[1] 
                            ? 'bg-[#007AFF]/10 text-[#007AFF] font-semibold' 
                            : 'bg-transparent text-[#1D1D1F] hover:bg-[#F5F5F7]'}`}
                    >
                        <img 
                            src={`https://flagcdn.com/w40/${c[1]}.png`} 
                            alt={c[0]}
                            className="w-5 h-auto rounded-[2px] shadow-sm ring-1 ring-black/5"
                        />
                        <span className="flex-1 text-left truncate">{c[0]}</span>
                        <span className={`text-xs font-mono ${country.iso2 === c[1] ? 'text-[#007AFF]/70' : 'text-gray-400'}`}>
                            +{c[2]}
                        </span>
                        {country.iso2 === c[1] && <Check className="w-3.5 h-3.5 ml-2" />}
                    </button>
                    ))
                ) : (
                    <div className="p-4 text-center text-xs text-gray-400 font-medium">
                        No countries found
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}