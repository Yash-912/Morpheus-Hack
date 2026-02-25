// ============================================================
// Loans API — Frontend service for loan endpoints
// ============================================================

import api from './api.service';

/**
 * Check loan eligibility for current user.
 */
export async function getEligibility() {
    const { data } = await api.get('/loans/eligibility');
    return data.data;
}

/**
 * Apply for a new loan.
 * @param {number} amount — loan amount in paise
 * @param {number} repaymentPercent — auto-deduct % from payouts
 */
export async function applyLoan(amount, repaymentPercent) {
    const { data } = await api.post('/loans/apply', { amount, repaymentPercent });
    return data.data;
}

/**
 * Get all active loans.
 */
export async function getActive() {
    const { data } = await api.get('/loans/active');
    return data.data;
}

/**
 * Get loan history (paginated).
 * @param {number} page
 * @param {number} limit
 */
export async function getHistory(page = 1, limit = 10) {
    const { data } = await api.get('/loans/history', { params: { page, limit } });
    return data;
}

/**
 * Make a manual repayment.
 * @param {string} loanId
 * @param {number} amount — repayment amount in paise
 */
export async function repay(loanId, amount) {
    const { data } = await api.post(`/loans/${loanId}/repay`, { amount });
    return data.data;
}
