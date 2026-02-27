// ============================================================
// Savings Cap Middleware — Dynamic Affordability Rule
// 10% cap when user has active loan/emergency fund repayments
// 20% cap when user is debt-free
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

/**
 * MOCK HELPER — Returns the user's average daily income.
 * TODO (Post-Hackathon): Replace with real Prisma aggregate
 * query against the Earning table for last 30 days.
 */
async function getUserAverageDailyIncome(userId) {
    // Hardcoded for MVP demo: ₹850/day average
    return 850;
}

/**
 * Middleware: savingsCap
 * Dynamic affordability cap:
 *   - 10% of avg daily income when user has active loan/emergency fund repayments
 *   - 20% of avg daily income when user is debt-free
 */
async function savingsCap(req, res, next) {
    try {
        const userId = req.user.id;
        const requestedDailyDeduction = req.body.dailyDeductionLimit || 0;

        // Get user's current active deduction rate
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { activeSavingsDeductionRate: true },
        });

        // Check for active repayment obligations (both Loan and Emergency Fund)
        const [activeLoan, activeCreditLine] = await Promise.all([
            prisma.loan.findFirst({ where: { userId, status: 'active' } }),
            prisma.creditLine.findFirst({ where: { userId, status: 'ACTIVE' } }),
        ]);

        const hasActiveRepayments = !!(activeLoan || activeCreditLine);
        const capPercent = hasActiveRepayments ? 0.10 : 0.20;
        const capLabel = hasActiveRepayments ? '10%' : '20%';

        const currentDeductions = user?.activeSavingsDeductionRate || 0;
        const avgDailyIncome = await getUserAverageDailyIncome(userId);
        const maxAllowed = avgDailyIncome * capPercent;

        if (currentDeductions + requestedDailyDeduction > maxAllowed) {
            const reason = hasActiveRepayments
                ? ` Your savings cap is reduced to ${capLabel} because you have an active ${activeLoan ? 'loan' : 'Emergency Fund'} repayment.`
                : '';

            logger.warn('Savings cap exceeded', {
                userId,
                currentDeductions,
                requested: requestedDailyDeduction,
                maxAllowed,
                hasActiveRepayments,
            });

            return res.status(400).json({
                success: false,
                error: {
                    code: 'AFFORDABILITY_CAP_EXCEEDED',
                    message: `Affordability Cap Reached: You cannot deduct more than ${capLabel} of your daily average (₹${maxAllowed.toFixed(0)}/day). Your current deductions are ₹${currentDeductions.toFixed(0)}/day.${reason}`,
                    details: {
                        currentDailyDeductions: currentDeductions,
                        requestedDeduction: requestedDailyDeduction,
                        maxAllowedDaily: maxAllowed,
                        averageDailyIncome: avgDailyIncome,
                        capPercent: capPercent * 100,
                        hasActiveRepayments,
                    },
                },
            });
        }

        // Attach for controller use
        req.savingsContext = { avgDailyIncome, maxAllowed, currentDeductions, capPercent, hasActiveRepayments };
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = savingsCap;
