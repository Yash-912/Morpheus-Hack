// ============================================================
// TDS API — Frontend service for Tax Compliance Hub
// ============================================================

import api from './api.service';

/**
 * Fetch mock Form 26AS TDS summary.
 * @param {string} pan — PAN number (e.g. ABCDE1234F)
 */
export async function getTdsSummary(pan) {
    const { data } = await api.get(`/tds/summary/${pan}`);
    return data.data;
}

/**
 * Submit ITR (mock filing with 2.5s server delay).
 * @param {{ pan: string, financialYear: string, consentGiven: string }} payload
 */
export async function submitItr(payload) {
    const { data } = await api.post('/tds/submit-itr', payload);
    return data;
}
