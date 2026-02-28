// ============================================================
// Route Constants — All frontend route paths in one place
// Usage: import { ROUTES } from '../constants/routes';
// ============================================================

export const ROUTES = {
    // Public
    LOGIN: '/login',
    AUTH_PHONE: '/auth/phone',

    // Onboarding
    ONBOARDING_KYC: '/onboarding/kyc',
    ONBOARDING_SELFIE: '/onboarding/selfie',
    ONBOARDING_PLATFORMS: '/onboarding/platforms',
    ONBOARDING_BANK: '/onboarding/bank',

    // Main app
    HOME: '/',
    WALLET: '/wallet',
    ZONES: '/zones',
    INSIGHTS: '/insights',
    LOANS: '/loans',
    SAVINGS: '/savings',
    PROFILE: '/profile',

    // Sub-pages (to be added)
    TRANSACTIONS: '/wallet/transactions',
    TAX: '/insights/tax',
    ALGO_INSIGHTS: '/insights/algo',
    EXPENSES: '/insights/expenses',
    LINKED_ACCOUNTS: '/profile/linked-accounts',
    SUPPORT: '/profile/support',

};

export default ROUTES;
