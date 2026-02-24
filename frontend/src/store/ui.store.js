import { create } from 'zustand';

export const useUIStore = create((set) => ({
    activeTab: 'home', // For BottomNav synchronization
    activeModal: null, // e.g., 'cashout', 'expense_add'
    globalLoading: false,

    setActiveTab: (tabId) => set({ activeTab: tabId }),
    openModal: (modalId) => set({ activeModal: modalId }),
    closeModal: () => set({ activeModal: null }),
    setGlobalLoading: (isLoading) => set({ globalLoading: isLoading })
}));
