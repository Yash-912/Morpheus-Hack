// ============================================================
// Micro-Savings Controller — Digital Gold & Target Gullak
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

// Hardcoded gold rate for MVP (₹/gram)
const GOLD_RATE_PER_GRAM = 7000;

const microsavingsController = {
    /**
     * GET /api/microsavings/portfolio
     * Returns consolidated savings portfolio: digital gold + active gullaks.
     */
    async getPortfolio(req, res, next) {
        try {
            const userId = req.user.id;

            // Fetch digital gold holding
            const goldHolding = await prisma.digitalGoldHolding.findUnique({
                where: { userId },
            });

            // Fetch active savings goals (gullaks)
            const gullaks = await prisma.savingsGoal.findMany({
                where: { userId, isCompleted: false },
                orderBy: { createdAt: 'desc' },
            });

            // Fetch completed gullaks
            const completedGullaks = await prisma.savingsGoal.findMany({
                where: { userId, isCompleted: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            });

            const goldGrams = goldHolding?.totalGrams || 0;
            const liveInrValue = Math.round(goldGrams * GOLD_RATE_PER_GRAM);

            // Get user's active deduction rate
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { activeSavingsDeductionRate: true },
            });

            res.json({
                success: true,
                data: {
                    gold: {
                        grams: goldGrams,
                        liveInrValue,
                        ratePerGram: GOLD_RATE_PER_GRAM,
                        averagePurchasePrice: goldHolding?.averagePurchasePrice || 0,
                    },
                    activeGullaks: gullaks.map((g) => ({
                        id: g.id,
                        title: g.title,
                        targetAmount: g.targetAmount,
                        currentAmount: g.currentAmount,
                        dailyDeduction: g.dailyDeductionLimit,
                        progress: g.targetAmount > 0
                            ? Math.round((g.currentAmount / g.targetAmount) * 100)
                            : 0,
                    })),
                    completedGullaks: completedGullaks.map((g) => ({
                        id: g.id,
                        title: g.title,
                        targetAmount: g.targetAmount,
                    })),
                    totalDailyDeductions: user?.activeSavingsDeductionRate || 0,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/microsavings/gold/buy
     * Quick-buy digital gold (simulated).
     */
    async buyGold(req, res, next) {
        try {
            const userId = req.user.id;
            const { amount } = req.body; // INR amount to buy

            const gramsToAdd = amount / GOLD_RATE_PER_GRAM;

            // Upsert the holding
            const holding = await prisma.digitalGoldHolding.upsert({
                where: { userId },
                create: {
                    userId,
                    totalGrams: gramsToAdd,
                    averagePurchasePrice: GOLD_RATE_PER_GRAM,
                },
                update: {
                    totalGrams: { increment: gramsToAdd },
                },
            });

            logger.info('Gold purchased', { userId, amount, grams: gramsToAdd });

            res.json({
                success: true,
                data: {
                    purchased: { amount, grams: gramsToAdd },
                    updated: {
                        totalGrams: holding.totalGrams,
                        liveInrValue: Math.round(holding.totalGrams * GOLD_RATE_PER_GRAM),
                    },
                },
                message: `₹${amount} automatically deducted from today's payout. ${gramsToAdd.toFixed(4)}g gold added.`,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/microsavings/gullak/create
     * Create a new Target Gullak (savings goal).
     * Protected by savingsCap middleware.
     */
    async createGullak(req, res, next) {
        try {
            const userId = req.user.id;
            const { title, targetAmount, dailyDeductionLimit } = req.body;

            // Create the goal
            const gullak = await prisma.savingsGoal.create({
                data: {
                    userId,
                    title,
                    targetAmount,
                    currentAmount: 0,
                    dailyDeductionLimit,
                    isCompleted: false,
                },
            });

            // Update user's total daily deduction rate
            await prisma.user.update({
                where: { id: userId },
                data: {
                    activeSavingsDeductionRate: {
                        increment: dailyDeductionLimit,
                    },
                },
            });

            logger.info('Gullak created', { userId, title, targetAmount, dailyDeductionLimit });

            // Calculate estimated completion days
            const daysToComplete = Math.ceil(targetAmount / dailyDeductionLimit);

            res.status(201).json({
                success: true,
                data: {
                    id: gullak.id,
                    title: gullak.title,
                    targetAmount: gullak.targetAmount,
                    dailyDeduction: gullak.dailyDeductionLimit,
                    estimatedDays: daysToComplete,
                    progress: 0,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/microsavings/gold/sell
     * 1-Tap Emergency Liquidation — sell gold for INR.
     */
    async sellGold(req, res, next) {
        try {
            const userId = req.user.id;
            const { amount } = req.body; // INR to liquidate

            const holding = await prisma.digitalGoldHolding.findUnique({
                where: { userId },
            });

            if (!holding || holding.totalGrams * GOLD_RATE_PER_GRAM < amount) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_GOLD',
                        message: `Insufficient gold balance. Available: ₹${Math.round((holding?.totalGrams || 0) * GOLD_RATE_PER_GRAM)}`,
                    },
                });
            }

            const gramsToSell = amount / GOLD_RATE_PER_GRAM;

            await prisma.digitalGoldHolding.update({
                where: { userId },
                data: { totalGrams: { decrement: gramsToSell } },
            });

            logger.info('Gold sold (emergency liquidation)', { userId, amount, grams: gramsToSell });

            res.json({
                success: true,
                data: {
                    sold: { amount, grams: gramsToSell },
                    message: `₹${amount} will be credited to your bank account via IMPS instantly.`,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = microsavingsController;
