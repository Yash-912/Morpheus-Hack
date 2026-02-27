// ============================================================
// Credit Controller — Emergency Fund (Micro-Credit Line)
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

// Flat convenience fee structure (from analysis_results.md)
const CONVENIENCE_FEES = {
    500: 15,
    1000: 30,
    1500: 45,
};

/**
 * Calculate the emergency fund limit based on GigScore.
 * Score 300-399 → ₹500
 * Score 400-499 → ₹1,000
 * Score 500+    → ₹1,500
 */
function getEmergencyLimit(score) {
    if (score >= 500) return 1500;
    if (score >= 400) return 1000;
    if (score >= 300) return 500;
    return 0;
}

const creditController = {
    /**
     * GET /api/credit/status
     * Returns current credit status, active loans, and available limits.
     */
    async getStatus(req, res, next) {
        try {
            const userId = req.user.id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { gigScore: true, onboardingTier: true },
            });

            const score = user?.gigScore || 0;
            const tier = user?.onboardingTier || 1;

            // Check for active credit line
            const activeLoan = await prisma.creditLine.findFirst({
                where: { userId, status: 'ACTIVE' },
            });

            // Get repayment history count
            const repaidCount = await prisma.creditLine.count({
                where: { userId, status: 'REPAID' },
            });

            // Count active loans this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyCount = await prisma.creditLine.count({
                where: {
                    userId,
                    createdAt: { gte: startOfMonth },
                },
            });

            const emergencyLimit = getEmergencyLimit(score);

            res.json({
                success: true,
                data: {
                    tier,
                    score,
                    hasActiveLoan: !!activeLoan,
                    activeLoan: activeLoan ? {
                        id: activeLoan.id,
                        type: activeLoan.type,
                        principalAmount: activeLoan.principalAmount,
                        outstandingAmount: activeLoan.outstandingAmount,
                        dailyRepaymentRate: activeLoan.dailyRepaymentRate,
                        progress: activeLoan.principalAmount > 0
                            ? Math.round(((activeLoan.principalAmount + (CONVENIENCE_FEES[activeLoan.principalAmount] || 0) - activeLoan.outstandingAmount) / (activeLoan.principalAmount + (CONVENIENCE_FEES[activeLoan.principalAmount] || 0))) * 100)
                            : 0,
                        createdAt: activeLoan.createdAt,
                    } : null,
                    limits: {
                        emergency: emergencyLimit,
                        monthlyUsed: monthlyCount,
                        monthlyMax: 3,
                        canApply: !activeLoan && monthlyCount < 3 && tier >= 2,
                    },
                    repaymentHistory: {
                        totalRepaid: repaidCount,
                    },
                    convenienceFees: CONVENIENCE_FEES,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/credit/apply
     * Apply for an emergency fund (micro-credit line).
     * - Protected by creditTierGate middleware (Tier 2+ only).
     * - Validates: no active loan, < 3/month, amount within score limit.
     */
    async apply(req, res, next) {
        try {
            const userId = req.user.id;
            const { amount, reason } = req.body; // ₹500, ₹1000, or ₹1500

            const { score } = req.creditContext;

            // Validate amount
            const maxLimit = getEmergencyLimit(score);
            if (amount > maxLimit) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'AMOUNT_EXCEEDS_LIMIT',
                        message: `Your GigScore (${score}) allows up to ₹${maxLimit}. Increase your score to unlock higher limits.`,
                    },
                });
            }

            // Check for active loan (one at a time rule)
            const activeLoan = await prisma.creditLine.findFirst({
                where: { userId, status: 'ACTIVE' },
            });

            if (activeLoan) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'ACTIVE_LOAN_EXISTS',
                        message: 'You already have an active Emergency Fund. Repay it before taking a new one.',
                    },
                });
            }

            // Check monthly limit (max 3)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const monthlyCount = await prisma.creditLine.count({
                where: { userId, createdAt: { gte: startOfMonth } },
            });

            if (monthlyCount >= 3) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MONTHLY_LIMIT_REACHED',
                        message: 'You have reached the maximum of 3 Emergency Funds this month.',
                    },
                });
            }

            // Calculate convenience fee and outstanding
            const fee = CONVENIENCE_FEES[amount] || Math.round(amount * 0.03);
            const outstandingAmount = amount + fee;

            // Determine repayment window: ₹500=3 days, ₹1000=5 days, ₹1500=7 days
            const repaymentDays = amount <= 500 ? 3 : amount <= 1000 ? 5 : 7;
            const dailyRepaymentRate = 20; // 20% of daily payout auto-deducted

            // Create the credit line
            const creditLine = await prisma.creditLine.create({
                data: {
                    userId,
                    type: 'EMERGENCY',
                    principalAmount: amount,
                    outstandingAmount,
                    dailyRepaymentRate,
                    reason,
                    status: 'ACTIVE',
                },
            });

            logger.info('Emergency fund disbursed', { userId, amount, fee, outstandingAmount });

            res.status(201).json({
                success: true,
                data: {
                    id: creditLine.id,
                    principalAmount: amount,
                    convenienceFee: fee,
                    totalRepayable: outstandingAmount,
                    dailyRepaymentRate,
                    repaymentWindow: `${repaymentDays} days`,
                    message: `₹${amount} credited instantly. ₹${fee} convenience fee. Auto-deduct ${dailyRepaymentRate}% from daily payouts until ₹${outstandingAmount} is cleared.`,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = creditController;
