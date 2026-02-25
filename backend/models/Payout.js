// ============================================================
// Payout Model — Query helpers & business logic
// Augments Prisma with reusable payout queries.
// Usage: const PayoutModel = require('../models/Payout');
// ============================================================

const { prisma } = require('../config/database');

const PayoutModel = {
    /**
     * Get all payouts awaiting settlement reconciliation.
     * Used by settlement.scheduler.js and settlement.worker.js
     */
    async getPendingSettlements() {
        const now = new Date();
        return prisma.payout.findMany({
            where: {
                status: 'completed',
                settlementExpectedAt: { lt: now },
                settledAt: null,
            },
            include: {
                user: { select: { id: true, phone: true, name: true } },
            },
            orderBy: { settlementExpectedAt: 'asc' },
        });
    },

    /**
     * Get total payouts for a user today (daily limit check).
     * Used by payouts.controller.js to enforce DAILY_CASHOUT_LIMIT.
     */
    async getTodayTotal(userId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await prisma.payout.aggregate({
            where: {
                userId,
                createdAt: { gte: startOfDay },
                status: { in: ['pending', 'processing', 'completed'] },
            },
            _sum: { amount: true },
        });

        return Number(result._sum.amount || 0);
    },

    /**
     * Get recent payouts for a user (for RecentTransactions widget).
     * @param {string} userId
     * @param {number} limit - default 5
     */
    async getRecent(userId, limit = 5) {
        const payouts = await prisma.payout.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return payouts.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            fee: Number(p.fee),
            netAmount: Number(p.netAmount),
            type: p.type,
            status: p.status,
            upiId: p.upiId,
            initiatedAt: p.initiatedAt,
            completedAt: p.completedAt,
            failureReason: p.failureReason,
        }));
    },

    /**
     * Count payouts within the last N minutes for a user.
     * Used by fraud.service.js — rule: 3+ payouts in 1hr → block.
     */
    async countRecent(userId, minutes = 60) {
        const since = new Date(Date.now() - minutes * 60 * 1000);

        return prisma.payout.count({
            where: {
                userId,
                createdAt: { gte: since },
                status: { in: ['pending', 'processing', 'completed'] },
            },
        });
    },
};

module.exports = PayoutModel;
