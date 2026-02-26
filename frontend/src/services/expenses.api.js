// ============================================================
// Expenses API — Frontend service for expense endpoints
// ============================================================

import api from './api.service';

/**
 * Get expenses list with filters.
 * @param {object} filters — { page, limit, category, startDate, endDate }
 */
export async function getExpenses(filters = {}) {
    const { data } = await api.get('/expenses', { params: filters });
    return data;
}

/**
 * Get expense summary (monthly breakdown by category).
 * @param {number} month — 1-12
 * @param {number} year
 */
export async function getSummary(month, year) {
    const { data } = await api.get('/expenses/summary', { params: { month, year } });
    return data.data;
}

/**
 * Add a manual expense.
 * @param {object} expenseData — { category, amount, merchant, date, notes, isTaxDeductible }
 */
export async function addExpense(expenseData) {
    const { data } = await api.post('/expenses', expenseData);
    return data.data;
}

/**
 * Submit a batch of SMS messages for auto-parsing.
 * @param {Array<{body: string, receivedAt: string}>} messages
 */
export async function submitSmsBatch(messages) {
    const { data } = await api.post('/expenses/sms-batch', { messages });
    return data.data;
}

/**
 * Upload a receipt image for OCR expense extraction.
 * @param {FormData} formData — includes receipt image file
 */
export async function uploadReceipt(formData) {
    const { data } = await api.post('/expenses/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
}

/**
 * Delete an expense.
 * @param {string} expenseId
 */
export async function deleteExpense(expenseId) {
    const { data } = await api.delete(`/expenses/${expenseId}`);
    return data;
}
