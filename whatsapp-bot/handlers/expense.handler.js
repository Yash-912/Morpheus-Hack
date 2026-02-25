// ============================================================
// Expense Handler — EXPENSE_SUMMARY intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const { getTemplate } = require('../utils/templates');
const logger = require('../utils/logger');

const ExpenseHandler = {
    async handle({ user, lang }) {
        try {
            const data = await GigPayAPI.getExpenseSummary(user.accessToken);
            return getTemplate(lang, 'expenses', data);
        } catch (err) {
            logger.error('Expense handler error:', err.message);
            return getTemplate(lang, 'error');
        }
    },
};

module.exports = ExpenseHandler;
