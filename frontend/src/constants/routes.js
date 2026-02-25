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
    CASHOUT: '/cashout',
    ZONES: '/zones',
    INSIGHTS: '/insights',
    COMMUNITY: '/community',
    POST_JOB: '/post-job',
    LOANS: '/loans',
    SAVINGS: '/savings',
    PROFILE: '/profile',

    // Sub-pages (to be added)
    TRANSACTIONS: '/wallet/transactions',
    INSURANCE: '/wallet/insurance',
    TAX: '/insights/tax',
    ALGO_INSIGHTS: '/insights/algo',
    EXPENSES: '/insights/expenses',
    MY_JOBS: '/community/my-jobs',
    LINKED_ACCOUNTS: '/profile/linked-accounts',
    SUPPORT: '/profile/support',

    // Dynamic
    JOB_DETAIL: (id) => `/community/${id}`,
    WORKER_PROFILE: (id) => `/community/worker/${id}`,
};

export default ROUTES;
