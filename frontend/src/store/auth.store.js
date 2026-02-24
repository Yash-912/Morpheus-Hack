import { create } from 'zustand';

// Utility for safe localStorage
const loadFromStorage = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        return null;
    }
};

const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to localStorage', error);
    }
};

const removeFromStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to remove from localStorage', error);
    }
};

export const useAuthStore = create((set) => ({
    user: loadFromStorage('gigpay_user'),
    accessToken: loadFromStorage('gigpay_access_token'),
    refreshToken: loadFromStorage('gigpay_refresh_token'),
    isAuthenticated: !!loadFromStorage('gigpay_access_token'),
    isLoading: false,

    setLoading: (isLoading) => set({ isLoading }),

    login: (tokens, user) => {
        saveToStorage('gigpay_access_token', tokens.accessToken);
        saveToStorage('gigpay_refresh_token', tokens.refreshToken);
        saveToStorage('gigpay_user', user);
        set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
        });
    },

    logout: () => {
        removeFromStorage('gigpay_access_token');
        removeFromStorage('gigpay_refresh_token');
        removeFromStorage('gigpay_user');
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false
        });
    },

    updateUser: (updates) => set((state) => {
        const updatedUser = { ...state.user, ...updates };
        saveToStorage('gigpay_user', updatedUser);
        return { user: updatedUser };
    }),

    updateTokens: (tokens) => {
        if (tokens.accessToken) {
            saveToStorage('gigpay_access_token', tokens.accessToken);
        }
        if (tokens.refreshToken) {
            saveToStorage('gigpay_refresh_token', tokens.refreshToken);
        }
        set((state) => ({
            accessToken: tokens.accessToken || state.accessToken,
            refreshToken: tokens.refreshToken || state.refreshToken,
        }));
    }
}));
