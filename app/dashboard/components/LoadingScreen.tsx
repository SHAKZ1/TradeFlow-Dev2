'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useBranding } from '../BrandingContext';

export function LoadingScreen({ logo }: { logo?: string | null }) {
    const { logoUrl } = useBranding();
    
    // Priority: Prop > Context > Default
    const displayLogo = logo || logoUrl || "/tradeflow-logo-trimmed-transparent.png";

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.8 } }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F5F5F7] overflow-hidden perspective-1000"
        >
            {/* 1. AMBIENT AURORA (Deep Background) */}
            <motion.div 
                animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                }}
                transition={{ 
                    duration: 15, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-blue-100/40 via-purple-100/40 to-indigo-100/40 blur-[120px] opacity-100"
            />

            {/* 2. THE 3D PRISM CONTAINER */}
            <div className="relative z-10 flex flex-col items-center">
                
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative w-64 h-24 md:w-80 md:h-32 flex items-center justify-center"
                >
                    {/* LAYER A: The Red Shift (Depth) */}
                    <motion.div
                        animate={{ 
                            x: [-2, 2, -2], 
                            y: [1, -1, 1],
                            opacity: [0.3, 0.6, 0.3] 
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 mix-blend-multiply z-0"
                    >
                        <Image 
                            src={displayLogo} 
                            alt="Loading..." 
                            fill
                            className="object-contain"
                            style={{ filter: 'blur(1px) drop-shadow(4px 4px 0px rgba(255, 0, 0, 0.1))' }} 
                        />
                    </motion.div>

                    {/* LAYER B: The Blue Shift (Depth) */}
                    <motion.div
                        animate={{ 
                            x: [2, -2, 2], 
                            y: [-1, 1, -1],
                            opacity: [0.3, 0.6, 0.3] 
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute inset-0 mix-blend-multiply z-0"
                    >
                        <Image 
                            src={displayLogo} 
                            alt="Loading..." 
                            fill
                            className="object-contain"
                            style={{ filter: 'blur(1px) drop-shadow(-4px -4px 0px rgba(0, 0, 255, 0.1))' }} 
                        />
                    </motion.div>

                    {/* LAYER C: The Hero Logo (Sharp) */}
                    <motion.div
                        animate={{ scale: [0.98, 1.02, 0.98] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 z-20 drop-shadow-2xl"
                    >
                        <Image 
                            src={displayLogo} 
                            alt="TradeFlow" 
                            fill
                            className="object-contain"
                            priority
                        />
                        
                        {/* LAYER D: The "Liquid Light" Reflection (Shimmer) */}
                        {/* <motion.div
                            initial={{ x: '-150%', skewX: -20 }}
                            animate={{ x: '150%', skewX: -20 }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: 2, 
                                ease: [0.2, 0, 0.2, 1], // Custom bezier for "swoosh" feel
                                repeatDelay: 0.5 
                            }}
                            className="absolute inset-0 w-full h-full"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.0) 60%, transparent 100%)',
                                mixBlendMode: 'overlay',
                            }}
                        /> */}
                    </motion.div>
                </motion.div>

                {/* 3. THE PROGRESS BAR (Apple Style) */}
                <div className="mt-8 w-48 h-1 bg-gray-200 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-[#1D1D1F] rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ 
                            duration: 1.5, 
                            ease: "easeInOut", 
                            repeat: Infinity 
                        }}
                    />
                    {/* Glowing Leading Edge */}
                    <motion.div 
                        className="absolute top-0 h-full w-10 bg-white blur-[5px]"
                        initial={{ left: "-20%" }}
                        animate={{ left: "120%" }}
                        transition={{ 
                            duration: 1.5, 
                            ease: "easeInOut", 
                            repeat: Infinity 
                        }}
                    />
                </div>
                
                {/* 4. STATUS TEXT */}
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase font-sans"
                >
                    Synchronizing
                </motion.p>

            </div>
        </motion.div>
    );
}