// ============================================================
// Tax API — Frontend service for tax endpoints
// ============================================================

import api from './api.service';

/**
 * Get tax summary for a financial year.
 * @param {string} fy — e.g., "2025-26"
 */
export async function getSummary(fy) {
    const { data } = await api.get('/tax/summary', { params: { fy } });
    return data.data;
}

/**
 * Get deduction breakdown for a financial year.
 * @param {string} fy
 */
export async function getDeductions(fy) {
    const { data } = await api.get('/tax/deductions', { params: { fy } });
    return data.data;
}

/**
 * Calculate tax for given income and expenses.
 * @param {object} calcData — { grossIncome, expenses, regime, scheme }
 */
export async function calculate(calcData) {
    const { data } = await api.post('/tax/calculate', calcData);
    return data.data;
}

/**
 * Initiate tax filing via ClearTax integration.
 * @param {string} fy — financial year
 */
export async function fileTax(fy) {
    const { data } = await api.post('/tax/file', { fy });
    return data.data;
}

/**
 * Get filing status for a financial year.
 * @param {string} fy
 */
export async function getFilingStatus(fy) {
    const { data } = await api.get('/tax/filing-status', { params: { fy } });
    return data.data;
}
