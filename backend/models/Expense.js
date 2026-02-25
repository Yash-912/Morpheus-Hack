// ============================================================
// Expense Model — Query helpers & business logic
// Usage: const ExpenseModel = require('../models/Expense');
// ============================================================

const { prisma } = require('../config/database');

const ExpenseModel = {
    /**
     * Get monthly expenses grouped by category for a user.
     * @param {string} userId
     * @param {number} month - 1-12
     * @param {number} year
     */
    async getMonthlyByCategory(userId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const expenses = await prisma.expense.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
        });

        const byCategory = {};
        let total = 0;

        expenses.forEach((e) => {
            const amt = Number(e.amount);
            total += amt;
            if (!byCategory[e.category]) {
                byCategory[e.category] = { total: 0, count: 0, deductible: 0 };
            }
            byCategory[e.category].total += amt;
            byCategory[e.category].count += 1;
            if (e.isTaxDeductible) {
                byCategory[e.category].deductible += amt;
            }
        });

        return {
            month,
            year,
            total,
            byCategory,
            recordCount: expenses.length,
        };
    },

    /**
     * Get total tax-deductible expenses for a financial year.
     * Financial year: April 1 of startYear to March 31 of startYear+1.
     * @param {string} userId
     * @param {string} financialYear - e.g., "2024-25"
     */
    async getTotalDeductible(userId, financialYear) {
        const [startYearStr] = financialYear.split('-');
        const startYear = parseInt(startYearStr, 10);
        const fyStart = new Date(startYear, 3, 1); // April 1
        const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59, 999); // March 31

        const expenses = await prisma.expense.findMany({
            where: {
                userId,
                date: { gte: fyStart, lte: fyEnd },
                isTaxDeductible: true,
            },
        });

        const byCategory = {};
        let total = 0;

        expenses.forEach((e) => {
            const amt = Number(e.amount);
            total += amt;
            byCategory[e.category] = (byCategory[e.category] || 0) + amt;
        });

        return {
            financialYear,
            totalDeductible: total,
            byCategory,
            recordCount: expenses.length,
        };
    },

    /**
     * Get total expenses for a financial year (all categories).
     * Used by tax.service.js for tax calculation.
     */
    async getTotalForFY(userId, financialYear) {
        const [startYearStr] = financialYear.split('-');
        const startYear = parseInt(startYearStr, 10);
        const fyStart = new Date(startYear, 3, 1);
        const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59, 999);

        const result = await prisma.expense.aggregate({
            where: {
                userId,
                date: { gte: fyStart, lte: fyEnd },
            },
            _sum: { amount: true },
            _count: true,
        });

        return {
            total: Number(result._sum.amount || 0),
            count: result._count,
        };
    },
};

module.exports = ExpenseModel;
