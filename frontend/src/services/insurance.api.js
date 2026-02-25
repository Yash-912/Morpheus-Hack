// ============================================================
// Insurance API — Frontend service for insurance endpoints
// ============================================================

import api from './api.service';

/**
 * Get available insurance plans.
 */
export async function getPlans() {
    const { data } = await api.get('/insurance/plans');
    return data.data;
}

/**
 * Get active policies for current user.
 */
export async function getActive() {
    const { data } = await api.get('/insurance/active');
    return data.data;
}

/**
 * Activate an insurance plan.
 * @param {string} type — InsuranceType: daily_accident, weekly_health, device, vehicle_breakdown
 * @param {string} duration — 'daily', 'weekly', 'monthly'
 */
export async function activate(type, duration) {
    const { data } = await api.post('/insurance/activate', { type, duration });
    return data.data;
}

/**
 * Submit an insurance claim.
 * @param {string} policyId
 * @param {FormData} formData — includes description, documents
 */
export async function submitClaim(policyId, formData) {
    const { data } = await api.post(`/insurance/${policyId}/claim`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
}

/**
 * Get claim history for current user.
 */
export async function getClaims() {
    const { data } = await api.get('/insurance/claims');
    return data.data;
}
