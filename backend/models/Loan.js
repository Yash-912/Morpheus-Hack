// ============================================================
// Loan Model — Query helpers & business logic
// Augments Prisma with reusable loan queries.
// Usage: const LoanModel = require('../models/Loan');
// ============================================================

const { prisma } = require('../config/database');

const LoanModel = {
    /**
     * Get all active loans for a user.
     */
    async getActiveLoans(userId) {
        const loans = await prisma.loan.findMany({
            where: { userId, status: 'active' },
            include: { repaymentHistory: { orderBy: { date: 'desc' } } },
            orderBy: { createdAt: 'desc' },
        });

        return loans.map((l) => ({
            ...l,
            amount: Number(l.amount),
            totalRepayable: Number(l.totalRepayable),
            amountRepaid: Number(l.amountRepaid),
            outstandingBalance: Number(l.totalRepayable) - Number(l.amountRepaid),
            progressPercent: Number(l.totalRepayable) > 0
                ? Math.round((Number(l.amountRepaid) / Number(l.totalRepayable)) * 100)
                : 0,
        }));
    },

    /**
     * Get total outstanding balance across all active loans for a user.
     */
    async getTotalOutstanding(userId) {
        const loans = await prisma.loan.findMany({
            where: { userId, status: 'active' },
            select: { totalRepayable: true, amountRepaid: true },
        });

        return loans.reduce((total, l) => {
            return total + (Number(l.totalRepayable) - Number(l.amountRepaid));
        }, 0);
    },

    /**
     * Check if user has any defaulted loans (blocks new loan applications).
     */
    async hasDefaults(userId) {
        const count = await prisma.loan.count({
            where: { userId, status: 'defaulted' },
        });
        return count > 0;
    },

    /**
     * Check if user has an active loan with less than 50% repaid.
     * If so, they can't take a new loan.
     */
    async hasUnderRepaidActiveLoan(userId) {
        const activeLoans = await prisma.loan.findMany({
            where: { userId, status: 'active' },
            select: { totalRepayable: true, amountRepaid: true },
        });

        return activeLoans.some((l) => {
            const total = Number(l.totalRepayable);
            const repaid = Number(l.amountRepaid);
            return total > 0 && (repaid / total) < 0.5;
        });
    },

    /**
     * Get overdue loans (due date passed, not fully repaid, still active).
     * Used by loan.scheduler.js for default detection and reminders.
     */
    async getOverdueLoans() {
        const now = new Date();
        return prisma.loan.findMany({
            where: {
                status: 'active',
                dueDate: { lt: now },
            },
            include: {
                user: { select: { id: true, phone: true, name: true, fcmToken: true } },
            },
        });
    },

    /**
     * Get on-time repayment percentage for a user (used by GigScore).
     * Returns 0–1 ratio. Returns null if no loan history.
     */
    async getOnTimeRepaymentRatio(userId) {
        const loans = await prisma.loan.findMany({
            where: {
                userId,
                status: { in: ['repaid', 'defaulted', 'active'] },
            },
            select: { status: true, dueDate: true, amountRepaid: true, totalRepayable: true },
        });

        if (loans.length === 0) return null; // No loan history

        const onTime = loans.filter((l) => l.status === 'repaid').length;
        return onTime / loans.length;
    },
};

module.exports = LoanModel;
