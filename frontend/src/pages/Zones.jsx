import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useRealtimeStore } from '../store/realtime.store';
import { MapPin, Zap } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { useUIStore } from '../store/ui.store';

// Default center: Bengaluru
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const Zones = () => {
    const setActiveTab = useUIStore(state => state.setActiveTab);
    const zones = useRealtimeStore(state => state.latestZones) || [];

    // Fallback UI mock zones if backend hasn't emitted yet
    const displayZones = zones.length > 0 ? zones : [
        { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, demand: 'high', multiplier: '1.5x' },
        { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271, demand: 'medium', multiplier: '1.2x' },
        { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499, demand: 'high', multiplier: '1.8x' },
    ];

    useEffect(() => {
        // Highlight the second tab visually in the bottom nav if applicable
        setActiveTab('map');
    }, [setActiveTab]);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in -mx-4 -mt-4 relative">
            {/* Header overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                <Badge variant="success" className="shadow-brutal bg-white border-gigpay-navy">
                    <span className="w-2 h-2 rounded-full bg-gigpay-lime mr-2 animate-pulse" />
                    Live Demand
                </Badge>

                <div className="bg-white px-3 py-1.5 rounded-full border-[1.5px] border-gigpay-navy shadow-brutal text-sm font-bold flex items-center gap-1.5">
                    <Zap size={16} className="text-gigpay-navy" />
                    <span>Surge Active</span>
                </div>
            </div>

            {/* Google Map Placeholder wrapper */}
            <div className="flex-1 w-full bg-[#E2E8F0] relative overflow-hidden">
                {/* 
                  Require a literal API key in env to render real map.
                  Fallback to a visual placeholder if none exists.
                */}
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                        <Map
                            defaultZoom={12}
                            defaultCenter={DEFAULT_CENTER}
                            mapId="gigpay_zones_map" // Required for AdvancedMarker
                            disableDefaultUI={true}
                        >
                            {displayZones.map(zone => (
                                <AdvancedMarker
                                    key={zone.id}
                                    position={{ lat: zone.lat, lng: zone.lng }}
                                >
                                    <div className={`
                                        flex flex-col items-center justify-center 
                                        ${zone.demand === 'high' ? 'bg-[#FF5A5F] text-white' : 'bg-[#FFD166] text-gigpay-navy'}
                                        px-2 py-1 rounded-lg border-2 border-gigpay-navy shadow-brutal font-bold text-xs
                                    `}>
                                        <MapPin size={16} className="mb-0.5" />
                                        <span>{zone.multiplier}</span>
                                    </div>
                                </AdvancedMarker>
                            ))}
                        </Map>
                    </APIProvider>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gigpay-surface bg-grid-pattern opacity-80 text-center p-6 border-b-[1.5px] border-gigpay-border">
                        <MapPin size={48} className="text-gigpay-navy-mid mb-4 opacity-50" />
                        <h3 className="font-syne font-bold text-lg text-gigpay-navy mb-2">Map Preview Ready</h3>
                        <p className="font-dm-sans text-sm text-gigpay-text-secondary">
                            Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable the fully interactive tracking map.
                        </p>
                    </div>
                )}
            </div>

            {/* Bottom info panel overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl border-[1.5px] border-gigpay-navy shadow-brutal z-10">
                <h3 className="font-bold font-syne text-gigpay-navy mb-1">🔥 Hot Zones Nearby</h3>
                <p className="text-sm font-dm-sans text-gigpay-text-secondary">
                    Head to <span className="font-bold text-gigpay-navy">Indiranagar</span> or <span className="font-bold text-gigpay-navy">Whitefield</span> right now for 1.5x+ payouts on food delivery.
                </p>
            </div>
        </div>
    );
};

export default Zones;
