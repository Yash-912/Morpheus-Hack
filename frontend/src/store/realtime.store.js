import { create } from 'zustand';

export const useRealtimeStore = create((set) => ({
    latestZones: null,
    payoutStatus: null, // e.g., { id: 'payout123', status: 'processing', timestamp: '...' }
    unreadNotifications: 0,

    setLatestZones: (zonesData) => set({ latestZones: zonesData }),
    updatePayoutStatus: (statusData) => set({ payoutStatus: statusData }),
    setUnreadNotifications: (count) => set({ unreadNotifications: count }),
    incrementUnreadNotifications: () => set((state) => ({ unreadNotifications: state.unreadNotifications + 1 })),
    decrementUnreadNotifications: () => set((state) => ({ unreadNotifications: Math.max(0, state.unreadNotifications - 1) }))
}));
