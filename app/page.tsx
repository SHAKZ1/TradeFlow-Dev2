'use client';

import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileDemo } from './components/MobileDemo';
import { RoiCalculator } from './components/RoiCalculator';
import { FaqAccordion } from './components/FaqAccordion';
import CalendlyWidget from './components/CalendlyWidget';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Pricing } from './components/Pricing'; // Add this import
import { 
  LayoutDashboard, Inbox, CalendarDays, Search, 
  MapPin, Clock, ChevronRight, PlayCircle, BarChart3, Zap, Star, Check, Phone, ShieldCheck, MessageSquare
} from 'lucide-react';

// --- MOCK DATA ---
type CardType = {
  id: string;
  name: string;
  value: string;
  service: string;
  metaIcon: any;
  metaText: string;
};

const INITIAL_COLUMNS: Record<string, CardType[]> = {
  'new-leads': [
    { id: 'c1', name: 'Sarah Jenkins', value: '£2,500', service: 'Bathroom Renovation', metaIcon: MapPin, metaText: 'SW1A' },
    { id: 'c2', name: 'Mike Ross', value: '£850', service: 'Boiler Service', metaIcon: Clock, metaText: 'Recaptured Call' },
    { id: 'c3', name: 'James Miller', value: '£1,800', service: 'Kitchen Tiling', metaIcon: MapPin, metaText: 'E14' },
  ],
  'quote-sent': [
    { id: 'c4', name: 'David Kim', value: '£1,200', service: 'Fuse Box Upgrade', metaIcon: Clock, metaText: '1d ago' },
    { id: 'c5', name: 'Emma Stone', value: '£3,400', service: 'Garden Landscaping', metaIcon: MapPin, metaText: 'N1' },
  ],
  'job-booked': [
    { id: 'c6', name: 'Alice W.', value: '£4,500', service: 'Full Rewire • W4', metaIcon: Clock, metaText: 'Starts Mon' },
    { id: 'c7', name: 'Robert P.', value: '£950', service: 'Emergency Plumbing', metaIcon: MapPin, metaText: 'SE1' },
  ]
};

const COL_ORDER = ['new-leads', 'quote-sent', 'job-booked'];

export default function HomePage() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const constraintsRef = useRef(null);
  
  // --- DRAG LOGIC ---
  const handleDragEnd = (result: PanInfo, card: CardType, sourceColId: string) => {
    const x = result.offset.x;
    const width = 350; // Approx width of a column + gap
    
    // Calculate how many columns we jumped
    // Positive x = Right, Negative x = Left
    const hops = Math.round(x / width);
    
    if (hops === 0) return; // No move

    const currentIndex = COL_ORDER.indexOf(sourceColId);
    const targetIndex = currentIndex + hops;

    // Boundary Checks
    if (targetIndex < 0 || targetIndex >= COL_ORDER.length) return;

    const targetColId = COL_ORDER[targetIndex];

    if (targetColId !== sourceColId) {
      setColumns(prev => {
        const sourceList = [...prev[sourceColId]];
        const targetList = [...prev[targetColId]];
        
        const cardIndex = sourceList.findIndex(c => c.id === card.id);
        if (cardIndex === -1) return prev;

        // Remove from source
        sourceList.splice(cardIndex, 1);
        
        // Add to target (at top)
        targetList.unshift(card);

        return {
          ...prev,
          [sourceColId]: sourceList,
          [targetColId]: targetList
        };
      });
    }
  };

  return (
    <>
      <Header />
      <main style={{ overflowX: 'hidden' }}>
        
        {/* --- HERO SECTION (The "Steve Jobs" Silence) --- */}
        <section className="lp-section" style={{ 
            minHeight: '100vh', /* Forces full screen */
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingTop: '120px', 
            paddingBottom: '100', /* Remove bottom padding to let image touch edge */
            position: 'relative',
            overflow: 'hidden'
        }}>
          
          {/* 1. Aurora Background (Subtle & Deep) */}
          <div className="lp-hero-aurora" style={{ opacity: 0.6 }} />
          
          <div className="lp-container" style={{ textAlign: 'center', position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* 2. The NEPQ Hook */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className='h-screen justify-center items-center flex flex-col'
            >
              <h1 className="" style={{ margin: '0 auto', fontSize: 'clamp(3.5rem, 7vw, 6rem)', letterSpacing: '-0.04em' }}>
                {/* You’re winning on the tools. <br className="hidden md:block" /> */}
                <span className="lp-text-gradient-blue">More Jobs. Less Admin</span>
              </h1>
              
              <p className="lp-text-large" style={{ maxWidth: '680px', margin: '40px auto 50px', color: '#424245', fontSize: '20px', lineHeight: 1.6 }}>
                The difference between a "job" and a "business" is a system. <br/>
                Stop letting missed calls and forgotten invoices cap your income.
              </p>
              
              {/* 3. CTA Buttons (Minimalist) */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
                <a href="#book-a-call" className="lp-button lp-button-primary" style={{ height: '56px', padding: '0 48px', fontSize: '17px', borderRadius: '99px' }}>
                  Get Your Blueprint
                </a>
                <a href="#calculator" className="lp-button lp-button-secondary" style={{ height: '56px', padding: '0 36px', fontSize: '17px', display: 'flex', gap: '10px', borderRadius: '99px' }}>
                  <PlayCircle size={20} /> See How It Works
                </a>
              </div>
            </motion.div>

          </div>

          {/* 4. The "Tease" (Dashboard Peeking Up) */}
          {/* This sits at the absolute bottom of the 100vh container, inviting the scroll */}
          <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
              style={{ 
                  width: '100%', 
                  maxWidth: '1400px', 
                  margin: '0 auto',
                  position: 'relative',
                  bottom: '-100px', /* Push it down so only the top header is visible */
                  zIndex: 5
              }}
          >
               {/* We wrap the mock window in a container that fades it out at the bottom */}
               <div style={{ 
                   maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
                   WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
               }}>
                   <div className="mock-window lp-glass-panel">
                      {/* ... (KEEP ALL THE EXISTING MOCK WINDOW CODE HERE) ... */}
                      {/* ... (Paste the exact same Mock Window code from the previous step) ... */}
                      
                      {/* MacOS Window Controls */}
                      <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px', zIndex: 20 }}>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#FF5F57', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#FEBC2E', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#28C840', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                      </div>

                      {/* SIDEBAR */}
                      <div className="mock-sidebar" style={{ paddingTop: '80px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="mock-nav-item active">
                                  <LayoutDashboard size={18} className="text-[#0038A8]" /> <span>Dashboard</span>
                              </div>
                              <div className="mock-nav-item">
                                  <Inbox size={18} /> <span>Inbox</span>
                                  <span style={{ marginLeft: 'auto', background: '#FF3B30', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>3</span>
                              </div>
                              <div className="mock-nav-item">
                                  <CalendarDays size={18} /> <span>Calendar</span>
                              </div>
                              <div className="mock-nav-item">
                                  <BarChart3 size={18} /> <span>Analytics</span>
                              </div>
                              <div className="mock-nav-item">
                                  <Zap size={18} /> <span>Settings</span>
                              </div>
                          </div>
                          
                          {/* MONTHLY GOAL WIDGET */}
                          <div style={{ 
                              marginTop: 'auto', 
                              padding: '20px', 
                              background: '#FFFFFF', 
                              borderRadius: '18px', 
                              border: '1px solid rgba(0,0,0,0.04)', 
                              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)' 
                          }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Monthly Goal</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34C759', boxShadow: '0 0 8px rgba(52, 199, 89, 0.4)' }}></div>
                                      <span style={{ fontSize: '10px', fontWeight: 600, color: '#34C759' }}>On Track</span>
                                  </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '26px', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>£15,200</span>
                                  <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>/ £18k</span>
                              </div>

                              {/* iOS Progress Bar (84%) */}
                              <div style={{ width: '100%', height: '6px', background: '#F2F2F7', borderRadius: '10px', overflow: 'hidden' }}>
                                  <div style={{ 
                                      width: '84.4%', 
                                      height: '100%', 
                                      background: 'linear-gradient(90deg, #0038A8 0%, #007AFF 100%)', 
                                      borderRadius: '10px',
                                      boxShadow: '0 0 10px rgba(0, 56, 168, 0.2)'
                                  }}></div>
                              </div>
                          </div>
                      </div>

                      {/* MAIN CONTENT */}
                      <div className="mock-main">
                          {/* Header */}
                          <div className="mock-header">
                              <span style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Job Board</span>
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#F3F4F6', borderRadius: '10px', width: '240px' }}>
                                      <Search size={16} color="#6B7280" />
                                      <span style={{ fontSize: '14px', color: '#6B7280' }}>Search jobs...</span>
                                  </div>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0038A8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 10px rgba(0, 56, 168, 0.2)' }}>TF</div>
                              </div>
                          </div>

                          {/* Kanban */}
                          <div className="mock-kanban" ref={constraintsRef}>
                              
                              {/* Column 1: New Leads */}
                              <div className="mock-col">
                                  <div className="mock-col-header blue">
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em' }}>NEW LEADS</span>
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{columns['new-leads'].length}</span>
                                  </div>
                                  
                                  <AnimatePresence>
                                    {columns['new-leads'].map(card => (
                                      <MockCard key={card.id} card={card} colId="new-leads" onDragEnd={handleDragEnd} color="blue" />
                                    ))}
                                  </AnimatePresence>
                              </div>

                              {/* Column 2: Quote Sent */}
                              <div className="mock-col">
                                  <div className="mock-col-header orange">
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em' }}>QUOTE SENT</span>
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{columns['quote-sent'].length}</span>
                                  </div>
                                  
                                  <AnimatePresence>
                                    {columns['quote-sent'].map(card => (
                                      <MockCard key={card.id} card={card} colId="quote-sent" onDragEnd={handleDragEnd} color="orange" />
                                    ))}
                                  </AnimatePresence>
                              </div>

                              {/* Column 3: Job Booked */}
                              <div className="mock-col">
                                  <div className="mock-col-header green">
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563', letterSpacing: '0.05em' }}>JOB BOOKED</span>
                                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{columns['job-booked'].length}</span>
                                  </div>
                                  
                                  <AnimatePresence>
                                    {columns['job-booked'].map(card => (
                                      <MockCard key={card.id} card={card} colId="job-booked" onDragEnd={handleDragEnd} color="green" />
                                    ))}
                                  </AnimatePresence>
                              </div>

                          </div>
                      </div>
                   </div>
               </div>
            </motion.div>

        </section>

        {/* --- FEATURES (NEPQ & APPLE BENTO) --- */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            
            {/* NEPQ HEADLINE */}
            <div style={{ maxWidth: '760px', marginBottom: '80px' }}>
              <h2 className="lp-h2">The Four Leaks <br /><span className="lp-text-gradient-blue">Draining Your Net Profit.</span></h2>
              <p className="lp-text-large">
                You are excellent at the trade, but the "business" side is likely costing you £2k-£5k per month in invisible losses. We plug the holes so you keep the water.
              </p>
            </div>

            <div className="lp-bento-grid">
              
              {/* CARD 1: THE MISSED CALL (Span 2) */}
              <motion.div 
                className="lp-card lp-span-2"
                whileHover="hover"
                initial="initial"
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div className="lp-icon-box" style={{ background: '#E6EEFA', color: '#0038A8' }}>
                      <Phone className="w-6 h-6" />
                    </div>
                    <h3 className="lp-h3">The Hard Work Tax</h3>
                    <p className="lp-text" style={{ marginTop: '12px', fontSize: '15px' }}>
                      When you get back to your missed calls, you find out they are no longer interested.<br/>
                      You miss the call, they call the next number on Google, your competitor gets the cash. <br/>
                      {/* It’s a mathematical certainty: if you don't answer immediately, they move to the next number on Google. */}
                    </p>
                    <p className="lp-text" style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>
                      The Fix: Our AI agent texts them instantly, securing the lead before they call a competitor.
                    </p>
                  </div>

                  {/* VISUAL: iOS Notification Animation */}
                  <div style={{ marginTop: 'auto', paddingTop: '20px', position: 'relative', height: '100px', display: 'flex', alignItems: 'center' }}>
                      <motion.div 
                        variants={{
                          initial: { x: -20, opacity: 0 },
                          hover: { x: 0, opacity: 1 }
                        }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="ios-notification"
                        style={{ width: '100%', maxWidth: '340px' }}
                      >
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                              <MessageSquare className="w-4 h-4" fill="currentColor" />
                          </div>
                          <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D1D1F' }}>MESSAGES</span>
                                <span style={{ fontSize: '10px', color: '#86868B' }}>now</span>
                              </div>
                              <p style={{ fontSize: '13px', color: '#1D1D1F', lineHeight: 1.2 }}>
                                "Hi, I'm on a job. How can I help?"
                              </p>
                          </div>
                      </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* CARD 2: REPUTATION (Tall Dark Pillar) */}
              <motion.div 
                className="lp-card lp-card-dark lp-row-2" 
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="lp-icon-box" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFD60A' }}>
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="lp-h3" style={{ color: '#FFF' }}>The "Silent" Customer</h3>
                  <p className="lp-text" style={{ color: '#A1A1A6', fontSize: '15px', marginTop: '12px' }}>
                    Word of mouth is too slow. In 2026, if you aren't 5-stars on Google, you are invisible to the premium clients who pay upfront.
                  </p>
                  <p className="lp-text" style={{ color: '#E5E5E5', fontSize: '14px', marginTop: '12px', fontWeight: 500 }}>
                    We turn every handshake into a digital asset automatically.
                  </p>
                  
                  {/* VISUAL: Google Rating Widget */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <div className="google-widget" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                            {/* <Image src="/Google.svg" alt="G" width={20} height={20} /> */}
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#5F6368' }}>TrustPilot Reviews</span>
                        </div>
                        <div style={{ fontSize: '56px', fontWeight: 700, color: '#1D1D1F', lineHeight: 1 }}>4.9</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: '#FFD60A', margin: '8px 0' }}>
                            {[1,2,3,4,5].map(i => (
                                <Star key={i} className="fill-current w-5 h-5" />
                            ))}
                        </div>
                        <p style={{ fontSize: '11px', color: '#86868B' }}>Based on 124 reviews</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CARD 3: THE CHASING TRAP */}
              <motion.div 
                className="lp-card"
                whileHover="hover"
                initial="initial"
              >
                <div className="lp-icon-box" style={{ background: '#FFF8F0', color: '#FF9500' }}>
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="lp-h3">The Classic:<br/> ' I need to think about it '</h3>
                <p className="lp-text" style={{ fontSize: '15px', marginTop: '12px' }}>
                  Thousands in potential revenue sits in your 'Sent' folder, dying a slow death because you hate pestering people.
                </p>
                
                {/* VISUAL: Status Badge */}
                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#FFF8F0', borderRadius: '12px', border: '1px solid rgba(255, 0, 0, 0.1)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF0000', boxShadow: '0 0 8px rgba(255, 0, 0, 0.5)' }}></div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF0000' }}>(#3) Final Quote Sent</span>
                    </div>
                </div>

              </motion.div>

              {/* CARD 4: THE EVENING SHIFT */}
              <motion.div 
                className="lp-card"
                whileHover="hover"
                initial="initial"
              >
                <div className="lp-icon-box" style={{ background: '#F2F2F7', color: '#AF52DE' }}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="lp-h3">The "7 PM - 10 PM" Shift</h3>
                <p className="lp-text" style={{ fontSize: '15px', marginTop: '12px' }}>
                  Pricing jobs at 9 PM means mistakes, burnout, and resentment. You finish the physical work; let us handle the digital work.
                </p>

                {/* VISUAL: Checkmark List */}
                <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '10px' }}>
                    {['Invoice', 'Quote', 'Schedule'].map((item, i) => (
                        <motion.div 
                            key={i}
                            variants={{
                                initial: { scale: 1, opacity: 0.6 },
                                hover: { scale: 1.1, opacity: 1, background: '#34C759', color: 'white' }
                            }}
                            transition={{ delay: i * 0.1 }}
                            style={{ 
                                padding: '6px 12px', borderRadius: '8px', 
                                background: '#F5F5F7', color: '#86868B',
                                fontSize: '11px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Check className="w-3 h-3" /> {item}
                        </motion.div>
                    ))}
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- MOBILE DEMO (NEPQ & APPLE OS) --- */}
        <section className="lp-section alt">
          <div className="lp-container">
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div className="lp-badge">The Pocket Office</div>
              <h2 className="lp-h2">The Office is Dead. <br /><span className="lp-text-gradient-blue">Long Live the Van.</span></h2>
              <p className="lp-text-large" style={{ maxWidth: '600px', margin: '0 auto' }}>
                You didn't start a trade business to sit behind a computer. TradeFlow gives you the power of a full admin team, right in your pocket.
              </p>
            </div>
            
            <MobileDemo />
          </div>
        </section>

        {/* --- ROI CALCULATOR (NEPQ & APPLE OS) --- */}
        <section id="calculator" className="lp-section">
          <div className="lp-container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="lp-h2">Calculate the Cost of "Busy".</h2>
              <p className="lp-text-large" style={{ maxWidth: '600px', margin: '0 auto' }}>
                You work hard to get the phone to ring. See exactly how much cash you are burning by not having a system to catch it.
              </p>
            </div>
            <RoiCalculator />
          </div>
        </section>

        {/* --- PRICING (NEPQ & APPLE OS) --- */}
        <section id="solution" className="lp-section alt">
          <div className="lp-container">
            
            {/* NEPQ HEADLINE */}
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 className="lp-h2" style={{ marginBottom: '24px' }}>The Cost of Inaction.</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <p className="lp-text-large" style={{ maxWidth: '600px', margin: '0 auto', color: '#424245' }}>
                  Think of this as an employee who works 24/7, never sleeps, and never misses a call.
                </p>
                
                {/* The "One Saved Job" Badge */}
                <div style={{ 
                    background: '#E6EEFA', 
                    color: '#0038A8', 
                    padding: '8px 16px', 
                    borderRadius: '99px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    display: 'inline-block'
                }}>
                    One saved job pays for the entire year.
                </div>
              </div>
            </div>

            {/* NEW PRICING COMPONENT */}
            <Pricing />
            
          </div>
        </section>

        {/* --- FAQ --- */}
        <section className="lp-section">
            <div className="lp-container" style={{ maxWidth: '800px' }}>
                <h2 className="lp-h2" style={{ textAlign: 'center', marginBottom: '60px' }}>Frequently Asked Questions</h2>
                <FaqAccordion />
            </div>
        </section>

        {/* --- CTA --- */}
        <section className="lp-section alt" style={{ textAlign: 'center' }}>
            <div className="lp-container">
                <h2 className="lp-h2">Ready to Scale?</h2>
                <p className="lp-text-large" style={{ marginBottom: '40px' }}>
                    Book your free Growth Audit. We'll map out exactly how to add £5k-£10k to your monthly revenue.
                </p>
                <div id="book-a-call" style={{ display: 'flex', justifyContent: 'center' }}>
                    <CalendlyWidget />
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

// --- HELPER COMPONENT FOR CARDS ---
function MockCard({ card, colId, onDragEnd, color }: { card: CardType, colId: string, onDragEnd: any, color: string }) {
  return (
    <motion.div 
      layoutId={card.id}
      layout // CRITICAL FOR SMOOTH REORDERING
      drag
      dragElastic={0} // Instant response
      dragMomentum={false} // No sliding
      onDragEnd={(e, info) => onDragEnd(info, card, colId)}
      whileHover={{ scale: 1.02, cursor: 'grab', boxShadow: "0 8px 16px rgba(0,0,0,0.08)" }}
      whileTap={{ scale: 1.05, cursor: 'grabbing', zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
      className={`mock-card ${color} cursor-grab active:cursor-grabbing`}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{card.name}</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{card.value}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: 500 }}>{card.service}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
                <card.metaIcon size={12} /> <span>{card.metaText}</span>
            </div>
        </div>
    </motion.div>
  );
}