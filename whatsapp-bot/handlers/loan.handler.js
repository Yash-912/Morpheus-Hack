// ============================================================
// Loan Handler — APPLY_LOAN intent
// Supports: checking eligibility, applying for a loan
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const SessionService = require('../services/session.service');
const { getTemplate } = require('../utils/templates');
const logger = require('../utils/logger');

const LoanHandler = {
    async handle({ user, entities, lang, phone }) {
        try {
            // If amount is provided directly, try to apply
            if (entities?.amount) {
                return LoanHandler._applyLoan(user, entities.amount, lang, phone);
            }

            // Check for active loan first
            const activeLoan = await GigPayAPI.getActiveLoan(user.accessToken);
            if (activeLoan) {
                const outstanding = Number(activeLoan.totalRepayable) - Number(activeLoan.repaidAmount);
                return getTemplate(lang, 'loanActiveLoan', {
                    amount: Number(activeLoan.amount),
                    outstanding,
                    repaymentPercent: activeLoan.repaymentPercent,
                });
            }

            // Show eligibility
            const eligibility = await GigPayAPI.getLoanEligibility(user.accessToken);

            if (!eligibility.eligible) {
                return getTemplate(lang, 'loanNotEligible', eligibility.reason || 'GigScore too low or active loan exists');
            }

            return getTemplate(lang, 'loanEligible', {
                gigScore: eligibility.gigScore,
                maxAmount: eligibility.maxAmount,
            });
        } catch (err) {
            logger.error('Loan handler error:', err.message);
            return getTemplate(lang, 'error');
        }
    },

    async _applyLoan(user, amount, lang, phone) {
        try {
            const result = await GigPayAPI.applyLoan(user.accessToken, amount, 20);
            return getTemplate(lang, 'loanApplied', {
                amount: result.amount || amount,
                repaymentPercent: result.repaymentPercent || 20,
            });
        } catch (err) {
            const reason = err.response?.data?.error?.message || 'Loan application failed';
            return lang === 'hi'
                ? `❌ Loan apply nahi hua: ${reason}`
                : `❌ Loan application failed: ${reason}`;
        }
    },
};

module.exports = LoanHandler;
