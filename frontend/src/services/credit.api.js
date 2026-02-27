// ============================================================
// Credit API — Frontend service for Emergency Fund endpoints
// ============================================================

import api from './api.service';

/**
 * Get credit status (limits, active loan, history).
 */
export async function getCreditStatus() {
    const { data } = await api.get('/credit/status');
    return data.data;
}

/**
 * Apply for an emergency fund.
 * @param {number} amount — ₹500, ₹1000, or ₹1500
 */
export async function applyEmergencyFund(amount, reason) {
    const { data } = await api.post('/credit/apply', { amount, reason });
    return data;
}
