// ============================================================
// GigScore API — Frontend service for GigScore endpoints
// ============================================================

import api from './api.service';

/**
 * Get the user's current GigScore overview (score, tier, breakdown).
 */
export async function getGigScoreOverview() {
    const { data } = await api.get('/gigscore/overview');
    return data.data;
}

/**
 * Get the user's GigScore history (monthly trend).
 */
export async function getGigScoreHistory() {
    const { data } = await api.get('/gigscore/history');
    return data.data;
}

/**
 * Get what features are unlocked for the user's current tier.
 */
export async function getGigScoreEligibility() {
    const { data } = await api.get('/gigscore/eligibility');
    return data.data;
}
