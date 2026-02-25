// ============================================================
// Saving Model — Query helpers
// Usage: const SavingModel = require('../models/Saving');
// ============================================================

const { prisma } = require('../config/database');

const SavingModel = {
    /**
     * Get all savings goals for a user with transaction summaries.
     */
    async getGoalsWithSummary(userId) {
        const savings = await prisma.saving.findMany({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                    take: 5, // Last 5 transactions per goal
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return savings.map((s) => ({
            ...s,
            goalAmount: s.goalAmount ? Number(s.goalAmount) : null,
            currentAmount: Number(s.currentAmount),
            interestEarned: Number(s.interestEarned),
            progressPercent: s.goalAmount && Number(s.goalAmount) > 0
                ? Math.min(100, Math.round((Number(s.currentAmount) / Number(s.goalAmount)) * 100))
                : null,
            transactions: s.transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
            })),
        }));
    },

    /**
     * Get total saved amount across all active goals.
     */
    async getTotalSaved(userId) {
        const result = await prisma.saving.aggregate({
            where: { userId, status: 'active' },
            _sum: { currentAmount: true, interestEarned: true },
        });

        return {
            totalSaved: Number(result._sum.currentAmount || 0),
            totalInterest: Number(result._sum.interestEarned || 0),
        };
    },

    /**
     * Calculate round-up amount for a given payout.
     * Rounds up to nearest ₹10 (1000 paise).
     * @param {number} payoutAmountPaise
     * @returns {number} roundUpPaise — amount to auto-save
     */
    calculateRoundUp(payoutAmountPaise) {
        const roundTo = 1000; // ₹10 in paise
        const remainder = payoutAmountPaise % roundTo;
        if (remainder === 0) return roundTo; // If exact, save ₹10
        return roundTo - remainder;
    },

    /**
     * Get active savings with auto-save enabled (for round-up processing).
     */
    async getAutoSaveGoals(userId) {
        return prisma.saving.findMany({
            where: {
                userId,
                status: 'active',
                autoSavePercent: { gt: 0 },
            },
        });
    },
};

module.exports = SavingModel;
