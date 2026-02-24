import { useQuery } from '@tanstack/react-query';
import { useRealtimeStore } from '../store/realtime.store';

export const useZones = (city) => {
    const latestZones = useRealtimeStore(state => state.latestZones);

    const initialZonesQuery = useQuery({
        queryKey: ['zones', city],
        queryFn: async () => {
            return new Promise(resolve => setTimeout(() => resolve([]), 800));
        },
        enabled: !!city
    });

    // Prefer realtime data via WebSockets if available, fallback to initial REST fetch
    return {
        zones: latestZones || initialZonesQuery.data,
        isLoading: initialZonesQuery.isLoading
    };
};
