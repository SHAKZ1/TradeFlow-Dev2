'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useBranding } from '../BrandingContext'; // <--- IMPORT

export function LoadingScreen({ logo }: { logo?: string | null }) {
    const { logoUrl } = useBranding(); // <--- GET FROM CONTEXT
    
    // Priority: Prop > Context > Default
    const displayLogo = logo || logoUrl || "/tradeflow-logo-trimmed-transparent.png";
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
        >
            {/* 1. ATMOSPHERIC BACKGROUND */}
            <motion.div 
                animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                }}
                transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-indigo-50/50 via-purple-50/30 to-blue-50/50 blur-[100px] opacity-80"
            />

            <div className="relative z-10 flex flex-col items-center">
                
                {/* 2. THE HOLOGRAPHIC LOGO STACK */}
                <div className="relative w-64 h-20 md:w-80 md:h-24">
                    
                    {/* Layer A: The Cyan Ghost */}
                    <motion.div
                        animate={{ x: [-1, 1, -1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 opacity-50 mix-blend-multiply"
                    >
                        <Image 
                            src={displayLogo} 
                            alt="Loading..." 
                            fill
                            className="object-contain"
                            style={{ filter: 'hue-rotate(90deg) blur(1px)' }} 
                        />
                    </motion.div>

                    {/* Layer B: The Magenta Ghost */}
                    <motion.div
                        animate={{ x: [1, -1, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 opacity-50 mix-blend-multiply"
                    >
                        <Image 
                            src={displayLogo} 
                            alt="Loading..." 
                            fill
                            className="object-contain"
                            style={{ filter: 'hue-rotate(-90deg) blur(1px)' }} 
                        />
                    </motion.div>

                    {/* Layer C: The Hero Logo */}
                    <motion.div
                        animate={{ scale: [0.98, 1.02, 0.98] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 z-20"
                    >
                        <Image 
                            src={displayLogo} 
                            alt="TradeFlow" 
                            fill
                            className="object-contain"
                            priority
                        />
                        
                        {/* Layer D: The "Liquid Light" Reflection */}
                        <motion.div
                            initial={{ x: '-150%', skewX: -25 }}
                            animate={{ x: '150%', skewX: -25 }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 2.5, 
                                ease: [0.22, 1, 0.36, 1], 
                                repeatDelay: 0.5 
                            }}
                            className="absolute inset-0 w-full h-full"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.0) 60%, transparent 100%)',
                                mixBlendMode: 'overlay',
                            }}
                        />
                    </motion.div>
                </div>

                {/* 3. THE QUANTUM LINE LOADER */}
                <div className="mt-10 relative w-32 h-[1px] bg-gray-100 overflow-hidden">
                    <motion.div 
                        className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 1.5, 
                            ease: "easeInOut" 
                        }}
                    />
                </div>
                
                {/* 4. MICRO-TYPOGRAPHY */}
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-4 text-[9px] font-medium tracking-[0.4em] text-gray-400 uppercase font-mono"
                >
                    Initialising
                </motion.p>

            </div>
        </motion.div>
    );
}