'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Maximize2, Minimize2, Map as MapIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WarRoomMapProps {
    data: { lat: number; lng: number; value: number; postcode: string }[];
    isTheaterMode: boolean;
    toggleTheaterMode: () => void;
}

// --- CONTROLS ---
function CustomControls({ toggleTheaterMode, isTheaterMode }: { toggleTheaterMode: () => void, isTheaterMode: boolean }) {
    const map = useMap();
    
    useEffect(() => {
        if (isTheaterMode) {
            map.scrollWheelZoom.enable();
            map.dragging.enable();
        } else {
            map.scrollWheelZoom.disable();
            map.dragging.disable();
        }
    }, [isTheaterMode, map]);

    return (
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
            <button 
                onClick={(e) => { e.stopPropagation(); toggleTheaterMode(); }}
                className="w-10 h-10 bg-white shadow-xl border border-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95"
            >
                {isTheaterMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            
            {isTheaterMode && (
                <div className="flex flex-col gap-1 bg-white shadow-xl border border-gray-100 rounded-xl p-1">
                    <button onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><Plus className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"><Minus className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
}

// --- SMART CONTROLLER (Auto-Fit Bounds) ---
function MapController({ data, isTheaterMode }: { data: any[], isTheaterMode: boolean }) {
    const map = useMap();
    
    useEffect(() => {
        setTimeout(() => { map.invalidateSize(); }, 400);

        if (data.length > 0) {
            // Calculate bounds to fit all points
            const bounds = L.latLngBounds(data.map(d => [d.lat, d.lng]));
            
            // If only one point, zoom in nicely. If multiple, fit them all.
            if (data.length === 1) {
                map.flyTo([data[0].lat, data[0].lng], 13, { duration: 1.5 });
            } else {
                map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
            }
        } else {
            // Default UK View
            map.flyTo([54.5, -4], 6, { duration: 1.5 });
        }
    }, [data, map, isTheaterMode]);
    
    return null;
}

export default function WarRoomMap({ data, isTheaterMode, toggleTheaterMode }: WarRoomMapProps) {
    // Default center (will be overridden by MapController)
    const center: [number, number] = [54.5, -4];

    // --- NEON BEACON ICON (CSS CLASS BASED) ---
    const createBeaconIcon = (value: number) => {
        const size = value > 5000 ? 24 : value > 1000 ? 18 : 14;
        
        // Determine class based on value
        let colorClass = 'beacon-low';
        if (value > 5000) colorClass = 'beacon-high';
        else if (value > 1000) colorClass = 'beacon-med';

        return L.divIcon({
            className: 'bg-transparent', // Important: Let our inner div handle style
            html: `<div class="neon-beacon ${colorClass}" style="width: ${size}px; height: ${size}px;"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        });
    };

    const formatCurrency = (value: number) => 
        new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);

    return (
        <>
            <AnimatePresence>
                {isTheaterMode && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[9990]"
                        onClick={toggleTheaterMode}
                    />
                )}
            </AnimatePresence>

            <motion.div 
                layout
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className={`bg-gray-50 overflow-hidden border border-gray-200
                    ${isTheaterMode 
                        ? "fixed top-[5%] left-[5%] right-[5%] bottom-[5%] z-[9999] rounded-[32px] shadow-2xl" 
                        : "relative h-full w-full rounded-[24px] shadow-sm z-0"
                    }`}
            >
                {/* HUD */}
                <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/5 border border-gray-100">
                            <MapIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Revenue Heatmap</h3>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Live Intelligence</p>
                            </div>
                        </div>
                    </div>
                </div>

                {isTheaterMode && (
                    <button onClick={toggleTheaterMode} className="absolute top-6 right-6 z-[1000] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                )}

                <MapContainer 
                    center={center} 
                    zoom={6} 
                    scrollWheelZoom={false} 
                    dragging={false}        
                    zoomControl={false}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%', background: '#F9FAFB' }}
                >
                    <MapController data={data} isTheaterMode={isTheaterMode} />
                    <CustomControls toggleTheaterMode={toggleTheaterMode} isTheaterMode={isTheaterMode} />
                    
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                    {data.map((d, i) => (
                        <Marker 
                            key={i} 
                            position={[d.lat, d.lng]} 
                            icon={createBeaconIcon(d.value)}
                        >
                            <Tooltip 
                                direction="top" 
                                offset={[0, -10]} 
                                opacity={1} 
                                className="elite-tooltip-light"
                            >
                                <div className="flex flex-col items-center gap-1 p-2 min-w-[100px]">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{d.postcode}</span>
                                    <span className="text-base font-bold text-gray-900">{formatCurrency(d.value)}</span>
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}
                </MapContainer>
            </motion.div>

            {/* GLOBAL STYLES FOR ICONS & TOOLTIPS */}
            <style jsx global>{`
                .neon-beacon {
                    border-radius: 50%;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    mix-blend-mode: multiply; /* THIS CREATES THE HEAT OVERLAP */
                }
                .beacon-low {
                    background: radial-gradient(circle, rgba(79, 70, 229, 0.8) 0%, rgba(79, 70, 229, 0) 70%);
                }
                .beacon-med {
                    background: radial-gradient(circle, rgba(245, 158, 11, 0.8) 0%, rgba(245, 158, 11, 0) 70%);
                }
                .beacon-high {
                    background: radial-gradient(circle, rgba(244, 63, 94, 0.9) 0%, rgba(244, 63, 94, 0) 70%);
                }
                
                .leaflet-tooltip.elite-tooltip-light {
                    background-color: rgba(255, 255, 255, 0.95) !important;
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(0, 0, 0, 0.05) !important;
                    border-radius: 16px !important;
                    color: #111827 !important;
                    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1) !important;
                    padding: 0 !important;
                }
                .leaflet-tooltip-top:before {
                    border-top-color: rgba(255, 255, 255, 0.95) !important;
                }
            `}</style>
        </>
    );
}