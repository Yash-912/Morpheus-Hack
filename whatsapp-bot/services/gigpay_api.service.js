// ============================================================
// GigPay API Service — HTTP client to main backend
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = process.env.GIGPAY_API_URL || 'http://localhost:5002';
const BOT_SECRET = process.env.GIGPAY_BOT_SECRET || '';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 12000,
    headers: {
        'Content-Type': 'application/json',
        'x-bot-secret': BOT_SECRET,
    },
});

// Log outgoing requests in debug mode
api.interceptors.request.use((config) => {
    logger.debug(`[GigPayAPI] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
});

// Log errors
api.interceptors.response.use(
    (res) => res,
    (err) => {
        logger.error('[GigPayAPI] Error:', {
            url: err.config?.url,
            status: err.response?.status,
            message: err.response?.data?.error?.message || err.message,
        });
        return Promise.reject(err);
    }
);

/**
 * All API calls use the user's JWT access token.
 * The bot authenticates on behalf of the user using their stored token.
 */
function authHeader(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const GigPayAPI = {
    /**
     * Lookup user by phone number (bot-to-backend internal call).
     * The backend must expose an internal endpoint for this.
     */
    async getUserByPhone(phone) {
        const res = await api.get('/api/users/by-phone', { params: { phone } });
        return res.data.data;
    },

    /** Get wallet balance */
    async getBalance(token) {
        const res = await api.get('/api/payouts/balance', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Get today's earnings */
    async getTodayEarnings(token) {
        const res = await api.get('/api/earnings/today', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Get earnings forecast (ML) */
    async getForecast(token) {
        const res = await api.get('/api/earnings/forecast', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Get hot zones for a city */
    async getZones(token, city) {
        const res = await api.get('/api/insights/algo', {
            headers: authHeader(token),
            params: { city, type: 'zone' },
        });
        return res.data.data;
    },

    /** Get ML hot zones from ML service endpoint via backend proxy */
    async getHotZones(token, city) {
        try {
            const res = await api.get(`/api/forecast/zones`, {
                headers: authHeader(token),
                params: { city },
            });
            return res.data.data || [];
        } catch {
            return [];
        }
    },

    /** Get fee preview for cashout */
    async getFeePreview(token, amount, type = 'standard') {
        const res = await api.get('/api/payouts/fee-preview', {
            headers: authHeader(token),
            params: { amount, type },
        });
        return res.data.data;
    },

    /** Initiate payout (requires withdrawalToken from biometric) */
    async initiatePayout(token, amount, withdrawalToken, type = 'standard') {
        const res = await api.post(
            '/api/payouts/initiate',
            { amount, type, withdrawal_token: withdrawalToken },
            { headers: authHeader(token) }
        );
        return res.data.data;
    },

    /** Get loan eligibility */
    async getLoanEligibility(token) {
        const res = await api.get('/api/loans/eligibility', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Get active loan */
    async getActiveLoan(token) {
        const res = await api.get('/api/loans/active', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Apply for loan */
    async applyLoan(token, amount, repaymentPercent = 20) {
        const res = await api.post(
            '/api/loans/apply',
            { amount, repaymentPercent },
            { headers: authHeader(token) }
        );
        return res.data.data;
    },

    /** Get insurance plans */
    async getInsurancePlans(token) {
        const res = await api.get('/api/insurance/plans', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Activate insurance plan */
    async activateInsurance(token, type, duration = 1) {
        const res = await api.post(
            '/api/insurance/activate',
            { type, duration },
            { headers: authHeader(token) }
        );
        return res.data.data;
    },

    /** Get tax summary */
    async getTaxSummary(token) {
        const currentYear = new Date().getFullYear();
        const month = new Date().getMonth();
        const fy = month >= 3 ? `${currentYear}-${String(currentYear + 1).slice(2)}` : `${currentYear - 1}-${String(currentYear).slice(2)}`;
        const res = await api.get(`/api/tax/summary/${fy}`, {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Get expense summary */
    async getExpenseSummary(token) {
        const res = await api.get('/api/expenses/summary', {
            headers: authHeader(token),
        });
        return res.data.data;
    },

    /** Get community jobs near location */
    async getCommunityJobs(token, lat, lng, radius = 5) {
        const res = await api.get('/api/community/jobs', {
            headers: authHeader(token),
            params: { lat, lng, radius },
        });
        return res.data.data;
    },

    /** Get user profile */
    async getProfile(token) {
        const res = await api.get('/api/users/profile', {
            headers: authHeader(token),
        });
        return res.data.data;
    },
};

module.exports = GigPayAPI;
