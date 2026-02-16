'use client';

import dynamic from 'next/dynamic';

interface WarRoomMapProps {
    data: { lat: number; lng: number; value: number; postcode: string }[];
    isTheaterMode: boolean;
    toggleTheaterMode: () => void;
}

const WarRoomMap = dynamic(() => import('./WarRoomMap'), { 
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-50 flex items-center justify-center rounded-[24px] border border-gray-100">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Calibrating Satellites...</span>
            </div>
        </div>
    )
});

export default function MapWrapper(props: WarRoomMapProps) {
    return <WarRoomMap {...props} />;
}