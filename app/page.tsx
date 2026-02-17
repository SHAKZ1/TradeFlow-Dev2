'use client';

import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileDemo } from './components/MobileDemo';
import { RoiCalculator } from './components/RoiCalculator';
import { FaqAccordion } from './components/FaqAccordion';
import CalendlyWidget from './components/CalendlyWidget';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Pricing } from './components/Pricing';
import { 
  LayoutDashboard, Inbox, CalendarDays, Search, 
  MapPin, Clock, PlayCircle, BarChart3, Zap, Check, Phone, MessageSquare, Star, ChevronDown
} from 'lucide-react';

// --- MOCK DATA ---
type CardType = { id: string; name: string; value: string; service: string; metaIcon: any; metaText: string; };

const INITIAL_COLUMNS: Record<string, CardType[]> = {
  'new-leads': [
    { id: 'c1', name: 'Sarah Jenkins', value: '£2,500', service: 'Bathroom Renovation', metaIcon: MapPin, metaText: 'SW1A' },
    { id: 'c2', name: 'Mike Ross', value: '£850', service: 'Boiler Service', metaIcon: Clock, metaText: 'Recaptured' },
  ],
  'quote-sent': [
    { id: 'c4', name: 'David Kim', value: '£1,200', service: 'Fuse Box Upgrade', metaIcon: Clock, metaText: '1d ago' },
  ],
  'job-booked': [
    { id: 'c6', name: 'Alice W.', value: '£4,500', service: 'Full Rewire • W4', metaIcon: Clock, metaText: 'Starts Mon' },
  ]
};

const COL_ORDER = ['new-leads', 'quote-sent', 'job-booked'];

export default function HomePage() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const constraintsRef = useRef(null);
  
  const handleDragEnd = (result: PanInfo, card: CardType, sourceColId: string) => {
    const x = result.offset.x;
    const width = 350;
    const hops = Math.round(x / width);
    if (hops === 0) return;
    const currentIndex = COL_ORDER.indexOf(sourceColId);
    const targetIndex = currentIndex + hops;
    if (targetIndex < 0 || targetIndex >= COL_ORDER.length) return;
    const targetColId = COL_ORDER[targetIndex];

    setColumns(prev => {
      const sourceList = [...prev[sourceColId]];
      const targetList = [...prev[targetColId]];
      const cardIndex = sourceList.findIndex(c => c.id === card.id);
      if (cardIndex === -1) return prev;
      sourceList.splice(cardIndex, 1);
      targetList.unshift(card);
      return { ...prev, [sourceColId]: sourceList, [targetColId]: targetList };
    });
  };

  return (
    <>
      <Header />
      <main style={{ overflowX: 'hidden' }}>
        
        {/* --- SECTION 1: THE HERO (PERFECTLY CENTERED) --- */}
        <section className="relative h-screen w-full flex flex-col items-center justify-center bg-white overflow-hidden">
          <div className="lp-hero-aurora" />
          
          <div className="lp-container relative z-10 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0038A8] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">The Operating System for Trades</span>
              </div>

              <h1 className="lp-h1-authority" style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)', marginBottom: '40px', lineHeight: 0.85 }}>
  <span 
    className="block pb-4 pr-[0.1em] -mr-[0.1em]"
    style={{ 
      backgroundImage: 'linear-gradient(180deg, #1D1D1F 0%, #0038A8 45%, #0055FF 100%)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
    }}
  >
    More Jobs.<br />
    Less Admin.
  </span>
</h1>
              
              <p className="lp-text-large" style={{ maxWidth: '720px', margin: '0 auto 56px', color: '#424245', fontSize: '21px', lineHeight: 1.5, fontWeight: 500 }}>
                The difference between a job and a business is a system. <br/>
                Stop letting missed calls and forgotten invoices cap your income.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#book-a-call" className="lp-button lp-button-primary" style={{ height: '60px', padding: '0 56px', fontSize: '18px', borderRadius: '99px' }}>
                  Get Your Blueprint
                </a>
                <a href="#calculator" className="lp-button lp-button-secondary" style={{ height: '60px', padding: '0 40px', fontSize: '18px', display: 'flex', gap: '12px', borderRadius: '99px' }}>
                  <PlayCircle size={22} /> See How It Works
                </a>
              </div>
            </motion.div>
          </div>

          {/* Scroll Hint */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 flex flex-col items-center gap-2 text-gray-300"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">The Engine</span>
            <ChevronDown size={16} className="animate-bounce" />
          </motion.div>
        </section>

        {/* --- SECTION 2: THE ENGINE (MOCK DASHBOARD) --- */}
        <section id="the-engine" className="lp-section pt-0 pb-20 bg-white">
          <div className="lp-container">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            >
                  <div className="mock-window lp-glass-panel" style={{ height: '600px' }}>
                      {/* MacOS Controls */}
                      <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '8px', zIndex: 20 }}>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#FF5F57', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#FEBC2E', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                          <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#28C840', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                      </div>

                      {/* SIDEBAR */}
                      <div className="mock-sidebar" style={{ paddingTop: '80px' }}>
                          <div className="mock-nav-item active">
                              <LayoutDashboard size={18} className="text-[#0038A8]" /> <span>Dashboard</span>
                          </div>
                          <div className="mock-nav-item">
                              <Inbox size={18} /> <span>Inbox</span>
                          </div>
                          <div className="mock-nav-item">
                              <CalendarDays size={18} /> <span>Calendar</span>
                          </div>
                          <div className="mock-nav-item">
                              <BarChart3 size={18} /> <span>Analytics</span>
                          </div>
                      </div>

                      {/* MAIN CONTENT */}
                      <div className="mock-main">
                          <div className="mock-header">
                              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Job Board</span>
                              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F3F4F6', borderRadius: '10px', width: '200px' }}>
                                      <Search size={14} color="#6B7280" />
                                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Search...</span>
                                  </div>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0038A8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>TF</div>
                              </div>
                          </div>

                          <div className="mock-kanban" ref={constraintsRef}>
                              {COL_ORDER.map(colId => (
                                <div key={colId} className="mock-col">
                                    <div className={`mock-col-header ${colId === 'new-leads' ? 'blue' : colId === 'quote-sent' ? 'orange' : 'green'}`}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#4B5563', letterSpacing: '0.1em' }}>{colId.replace('-', ' ').toUpperCase()}</span>
                                    </div>
                                    <AnimatePresence>
                                      {columns[colId].map(card => (
                                        <MockCard key={card.id} card={card} colId={colId} onDragEnd={handleDragEnd} color={colId === 'new-leads' ? 'blue' : colId === 'quote-sent' ? 'orange' : 'green'} />
                                      ))}
                                    </AnimatePresence>
                                </div>
                              ))}
                          </div>
                      </div>
                   </div>
            </motion.div>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="lp-section">
          <div className="lp-container">
            <div style={{ maxWidth: '760px', marginBottom: '80px' }}>
              <h2 className="lp-h2">The Four Leaks <br /><span className="lp-text-gradient-blue">Draining Your Net Profit.</span></h2>
              <p className="lp-text-large">
                You are excellent at the trade, but the "business" side is likely costing you £2k-£5k per month in invisible losses. We plug the holes so you keep the water.
              </p>
            </div>

            <div className="lp-bento-grid">
              {/* CARD 1: THE MISSED CALL */}
              <motion.div className="lp-card lp-span-2" whileHover="hover" initial="initial">
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div className="lp-icon-box" style={{ background: '#E6EEFA', color: '#0038A8' }}>
                      <Phone className="w-6 h-6" />
                    </div>
                    <h3 className="lp-h3">The Hard Work Tax</h3>
                    <p className="lp-text" style={{ marginTop: '12px', fontSize: '15px' }}>
                      You miss the call, they call the next number on Google, your competitor gets the cash.
                    </p>
                    <p className="lp-text" style={{ marginTop: '12px', fontSize: '14px', fontWeight: 600, color: '#1D1D1F' }}>
                      The Fix: Our AI agent texts them instantly, securing the lead before they call a competitor.
                    </p>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '20px', position: 'relative', height: '100px', display: 'flex', alignItems: 'center' }}>
                      <div className="ios-notification" style={{ width: '100%', maxWidth: '340px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                              <MessageSquare className="w-4 h-4" fill="currentColor" />
                          </div>
                          <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D1D1F' }}>MESSAGES</span>
                                <span style={{ fontSize: '10px', color: '#86868B' }}>now</span>
                              </div>
                              <p style={{ fontSize: '13px', color: '#1D1D1F', lineHeight: 1.2 }}>"Hi, I'm on a job. How can I help?"</p>
                          </div>
                      </div>
                  </div>
                </div>
              </motion.div>

              {/* CARD 2: REPUTATION */}
              <motion.div className="lp-card lp-card-dark lp-row-2" whileHover={{ scale: 1.01 }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="lp-icon-box" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFD60A' }}>
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="lp-h3" style={{ color: '#FFF' }}>The "Silent" Customer</h3>
                  <p className="lp-text" style={{ color: '#A1A1A6', fontSize: '15px', marginTop: '12px' }}>
                    Word of mouth is too slow. In 2026, if you aren't 5-stars on Google, you are invisible to premium clients.
                  </p>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <div className="google-widget" style={{ width: '100%' }}>
                        <div style={{ fontSize: '56px', fontWeight: 700, color: '#1D1D1F', lineHeight: 1 }}>4.9</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: '#FFD60A', margin: '8px 0' }}>
                            {[1,2,3,4,5].map(i => <Star key={i} className="fill-current w-5 h-5" />)}
                        </div>
                        <p style={{ fontSize: '11px', color: '#86868B' }}>Based on 124 reviews</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CARD 3: CHASING */}
              <motion.div className="lp-card" whileHover="hover">
                <div className="lp-icon-box" style={{ background: '#FFF8F0', color: '#FF9500' }}>
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="lp-h3">The Chasing Trap</h3>
                <p className="lp-text" style={{ fontSize: '15px', marginTop: '12px' }}>
                  Thousands in potential revenue sits in your 'Sent' folder because you hate pestering people.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#FFF8F0', borderRadius: '12px', border: '1px solid rgba(255, 0, 0, 0.1)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF0000', boxShadow: '0 0 8px rgba(255, 0, 0, 0.5)' }}></div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF0000' }}>Final Quote Sent</span>
                    </div>
                </div>
              </motion.div>

              {/* CARD 4: ADMIN */}
              <motion.div className="lp-card" whileHover="hover">
                <div className="lp-icon-box" style={{ background: '#F2F2F7', color: '#AF52DE' }}>
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="lp-h3">The 9 PM Shift</h3>
                <p className="lp-text" style={{ fontSize: '15px', marginTop: '12px' }}>
                  Pricing jobs at 9 PM means mistakes and burnout. You finish the physical work; let us handle the digital.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', gap: '10px' }}>
                    {['Invoice', 'Quote', 'Schedule'].map((item, i) => (
                        <div key={i} style={{ padding: '6px 12px', borderRadius: '8px', background: '#F5F5F7', color: '#86868B', fontSize: '11px', fontWeight: 600 }}>{item}</div>
                    ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="lp-section alt">
          <div className="lp-container">
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <div className="lp-badge">The Pocket Office</div>
              <h2 className="lp-h2">The Office is Dead. <br /><span className="lp-text-gradient-blue">Long Live the Van.</span></h2>
            </div>
            <MobileDemo />
          </div>
        </section>

        <section id="calculator" className="lp-section">
          <div className="lp-container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="lp-h2">Calculate the Cost of "Busy".</h2>
            </div>
            <RoiCalculator />
          </div>
        </section>

        <section id="solution" className="lp-section alt">
          <div className="lp-container">
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <h2 className="lp-h2">The Cost of Inaction.</h2>
            </div>
            <Pricing />
          </div>
        </section>

        <section className="lp-section">
            <div className="lp-container" style={{ maxWidth: '800px' }}>
                <h2 className="lp-h2" style={{ textAlign: 'center', marginBottom: '60px' }}>Frequently Asked Questions</h2>
                <FaqAccordion />
            </div>
        </section>

        <section className="lp-section alt" style={{ textAlign: 'center' }}>
            <div className="lp-container">
                <h2 className="lp-h2">Ready to Scale?</h2>
                <div id="book-a-call" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                    <CalendlyWidget />
                </div>
            </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

function MockCard({ card, colId, onDragEnd, color }: { card: CardType, colId: string, onDragEnd: any, color: string }) {
  return (
    <motion.div 
      layoutId={card.id}
      layout
      drag
      dragElastic={0}
      dragMomentum={false}
      onDragEnd={(e, info) => onDragEnd(info, card, colId)}
      whileHover={{ scale: 1.02, cursor: 'grab' }}
      whileTap={{ scale: 1.05, cursor: 'grabbing', zIndex: 50 }}
      className={`mock-card ${color} cursor-grab active:cursor-grabbing`}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{card.name}</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0038A8' }}>{card.value}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 600 }}>{card.service}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9CA3AF' }}>
                <card.metaIcon size={12} /> <span>{card.metaText}</span>
            </div>
        </div>
    </motion.div>
  );
}