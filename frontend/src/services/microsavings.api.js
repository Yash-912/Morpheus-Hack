// ============================================================
// Micro-Savings API — Frontend service for Digital Gold & Gullak
// ============================================================

import api from './api.service';

/**
 * Get full savings portfolio (gold + gullaks).
 */
export async function getMicroSavingsPortfolio() {
    const { data } = await api.get('/microsavings/portfolio');
    return data.data;
}

/**
 * Quick-buy digital gold.
 * @param {number} amount — INR amount
 */
export async function buyGold(amount) {
    const { data } = await api.post('/microsavings/gold/buy', { amount });
    return data;
}

/**
 * Sell gold (emergency liquidation).
 * @param {number} amount — INR to liquidate
 */
export async function sellGold(amount) {
    const { data } = await api.post('/microsavings/gold/sell', { amount });
    return data;
}

/**
 * Create a new Target Gullak.
 * @param {{ title: string, targetAmount: number, dailyDeductionLimit: number }} payload
 */
export async function createGullak(payload) {
    const { data } = await api.post('/microsavings/gullak/create', payload);
    return data;
}
