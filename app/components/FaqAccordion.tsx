'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    { 
        question: "Is this system complicated to use?", 
        answer: "Not at all. We do 100% of the technical setup. All you need is a simple app on your phone that works just like WhatsApp. If you can text, you can use this system." 
    },
    { 
        question: "Is there a long-term contract?", 
        answer: "No. The setup fee is a one-time project cost. The monthly retainer is for the software and support, and you can cancel anytime with 30 days' notice." 
    },
    { 
        question: "How long does it take to set up?", 
        answer: "Our standard setup process takes between 7-14 business days from our strategy call to your system going live. We handle everything for you." 
    },
    { 
        question: "Will this work with my existing website?", 
        answer: "Yes, absolutely. Our system integrates seamlessly with any existing website, whether it's on WordPress, Squarespace, or any other platform." 
    }
];

export const FaqAccordion = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, index) => {
                const isOpen = activeIndex === index;
                
                return (
                    <motion.div 
                        key={index}
                        initial={false}
                        onClick={() => setActiveIndex(isOpen ? null : index)}
                        style={{ 
                            cursor: 'pointer', 
                            borderRadius: '20px', 
                            border: isOpen ? '1px solid rgba(0, 56, 168, 0.2)' : '1px solid transparent',
                            background: isOpen ? '#FFF' : '#F5F5F7',
                            boxShadow: isOpen ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: isOpen ? '#0038A8' : '#1D1D1F', transition: 'color 0.3s' }}>
                                {faq.question}
                            </h3>
                            <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                background: isOpen ? '#0038A8' : '#E5E5EA',
                                color: isOpen ? '#FFF' : '#86868B',
                                transition: 'all 0.3s'
                            }}>
                                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div style={{ padding: '0 24px 24px 24px' }}>
                                        <p style={{ color: '#86868B', lineHeight: 1.6, fontSize: '16px' }}>
                                            {faq.answer}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
};