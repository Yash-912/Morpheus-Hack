// ============================================================
// Savings API — Frontend service for savings endpoints
// ============================================================

import api from './api.service';

/**
 * Get all savings goals for current user.
 */
export async function getGoals() {
    const { data } = await api.get('/savings');
    return data.data;
}

/**
 * Create a new savings goal.
 * @param {object} goalData — { type, goalName, goalAmount, partner, autoSavePercent }
 */
export async function createGoal(goalData) {
    const { data } = await api.post('/savings', goalData);
    return data.data;
}

/**
 * Deposit into a savings goal.
 * @param {string} savingId
 * @param {number} amount — in paise
 */
export async function deposit(savingId, amount) {
    const { data } = await api.post(`/savings/${savingId}/deposit`, { amount });
    return data.data;
}

/**
 * Withdraw from a savings goal.
 * @param {string} savingId
 * @param {number} amount — in paise
 */
export async function withdraw(savingId, amount) {
    const { data } = await api.post(`/savings/${savingId}/withdraw`, { amount });
    return data.data;
}

/**
 * Toggle auto-save (round-up) for a goal.
 * @param {string} savingId
 */
export async function toggleAutoSave(savingId) {
    const { data } = await api.patch(`/savings/${savingId}/auto-save`);
    return data.data;
}

/**
 * Get total saved across all goals.
 */
export async function getTotalSaved() {
    const { data } = await api.get('/savings/total');
    return data.data;
}
