const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

class FinanceService {
    /**
     * Centralized Engine to process an earning
     * @param {string} userId
     * @param {object} earningData { platform, date, grossAmount, netAmount, ... }
     * @returns {Promise<object>}
     */
    static async recordEarning(userId, earningData) {
        if (!earningData.netAmount) {
            earningData.netAmount = earningData.grossAmount;
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create the Earning Record
                const earning = await tx.earning.create({
                    data: {
                        userId,
                        platform: earningData.platform || 'other',
                        date: new Date(earningData.date || Date.now()),
                        grossAmount: BigInt(earningData.grossAmount),
                        netAmount: BigInt(earningData.netAmount),
                        platformDeductions: BigInt(earningData.platformDeductions || 0),
                        hoursWorked: earningData.hoursWorked || 0,
                        tripsCount: earningData.tripsCount || 0,
                        avgPerTrip: earningData.avgPerTrip ? BigInt(earningData.avgPerTrip) : null,
                        status: 'settled',
                        verified: true,
                        source: earningData.source || 'api'
                    }
                });

                let amountToWallet = BigInt(earningData.netAmount);

                // 2. Automated Loan Deduction (Emergency Funds/Credit Lines)
                const activeCreditLines = await tx.creditLine.findMany({
                    where: { userId, status: 'ACTIVE', outstandingAmount: { gt: 0 } }
                });

                let totalLoanDeducted = BigInt(0);

                for (const line of activeCreditLines) {
                    const deductionPercent = line.dailyRepaymentRate || 10;
                    let deductionPaise = (amountToWallet * BigInt(Math.round(deductionPercent))) / BigInt(100);

                    if (deductionPaise > line.outstandingAmount) {
                        deductionPaise = line.outstandingAmount;
                    }

                    if (deductionPaise > 0) {
                        const newOutstanding = line.outstandingAmount - deductionPaise;

                        await tx.creditLine.update({
                            where: { id: line.id },
                            data: {
                                outstandingAmount: newOutstanding,
                                status: newOutstanding === BigInt(0) ? 'REPAID' : 'ACTIVE'
                            }
                        });

                        amountToWallet -= deductionPaise;
                        totalLoanDeducted += deductionPaise;
                    }
                }

                // 3. Automated Micro-Savings (Gullak)
                const activeSavingsGoals = await tx.savingsGoal.findMany({
                    where: { userId, isCompleted: false }
                });

                let totalSavingsDeducted = BigInt(0);

                if (activeSavingsGoals.length > 0 && amountToWallet > 0) {
                    const goal = activeSavingsGoals[0];
                    let savingPaise = (amountToWallet * BigInt(5)) / BigInt(100);

                    const remainingToTarget = goal.targetAmount - goal.currentAmount;
                    if (savingPaise > remainingToTarget) {
                        savingPaise = remainingToTarget;
                    }

                    if (savingPaise > BigInt(0)) {
                        const newCurrent = goal.currentAmount + savingPaise;
                        await tx.savingsGoal.update({
                            where: { id: goal.id },
                            data: {
                                currentAmount: newCurrent,
                                isCompleted: newCurrent >= goal.targetAmount
                            }
                        });

                        amountToWallet -= savingPaise;
                        totalSavingsDeducted += savingPaise;
                    }
                }

                // 4. Update the User's Wallet
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        walletBalance: { increment: amountToWallet },
                        walletLifetimeEarned: { increment: BigInt(earningData.netAmount) }
                    }
                });

                // 5. Compute GigScore (Lightweight recalculation)
                await FinanceService.recalculateGigScore(userId, tx, earningData.date);

                return {
                    earningId: earning.id,
                    originalEarned: earningData.netAmount,
                    loanDeducted: Number(totalLoanDeducted),
                    savingsDeducted: Number(totalSavingsDeducted),
                    addedToWallet: Number(amountToWallet),
                    newWalletBalance: Number(updatedUser.walletBalance)
                };
            }, {
                maxWait: 30000,
                timeout: 30000
            });

            return result;
        } catch (error) {
            logger.error('FinanceService Engine Error', error);
            throw error;
        }
    }

    /**
     * Centralized Engine to process an expense
     */
    static async recordExpense(userId, expenseData) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const expense = await tx.expense.create({
                    data: {
                        userId,
                        category: expenseData.category || 'other',
                        amount: BigInt(expenseData.amount),
                        date: new Date(expenseData.date || Date.now()),
                        merchant: expenseData.merchant,
                        source: expenseData.source || 'manual'
                    }
                });

                if (expenseData.deductFromWallet) {
                    await tx.user.update({
                        where: { id: userId },
                        data: {
                            walletBalance: { decrement: BigInt(expenseData.amount) }
                        }
                    });
                }

                await FinanceService.recalculateGigScore(userId, tx, expenseData.date);
                return expense;
            }, {
                maxWait: 30000,
                timeout: 30000
            });
            return result;
        } catch (error) {
            logger.error('FinanceService Expense Error', error);
            throw error;
        }
    }

    /**
     * Recalculates GigScore based on monthly earnings
     */
    static async recalculateGigScore(userId, tx, currentDate) {
        const dateObj = new Date(currentDate || Date.now());
        const firstDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);

        const earningsAgg = await tx.earning.aggregate({
            where: {
                userId,
                date: { gte: firstDayOfMonth }
            },
            _sum: { netAmount: true }
        });

        const currentMonthPaise = earningsAgg._sum.netAmount || BigInt(0);
        const currentMonthRupees = Number(currentMonthPaise) / 100;

        let earnedPoints = Math.floor(currentMonthRupees / 100);
        let newTotalScore = 600 + earnedPoints;
        if (newTotalScore > 850) newTotalScore = 850;

        await tx.user.update({
            where: { id: userId },
            data: { gigScore: newTotalScore }
        });

        const existingHistory = await tx.gigScoreHistory.findFirst({
            where: {
                userId,
                month: firstDayOfMonth
            }
        });

        const consistencyScore = Math.min(100, (currentMonthRupees / 10000) * 100);

        if (existingHistory) {
            await tx.gigScoreHistory.update({
                where: { id: existingHistory.id },
                data: {
                    totalScore: newTotalScore,
                    earningsConsistencyScore: consistencyScore
                }
            });
        } else {
            await tx.gigScoreHistory.create({
                data: {
                    userId,
                    month: firstDayOfMonth,
                    totalScore: newTotalScore,
                    earningsConsistencyScore: consistencyScore,
                    repaymentHistoryScore: 100,
                    platformTenureScore: 100,
                    engagementScore: 100,
                    financialDisciplineScore: 100
                }
            });
        }
    }
}

module.exports = FinanceService;
