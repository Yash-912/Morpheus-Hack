// ============================================================
// Cashout Rules Engine — Rule-based withdrawal calculation
// 4-Layer System: Settlement Buffer → GigScore Tier → Auto-Deductions → 50% Floor
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

// GigScore access tiers — determines what % of unlocked pool the worker can access
const GIGSCORE_TIERS = [
    { min: 750, max: 850, label: 'Excellent', accessPercent: 0.85, color: '#22C55E' },
    { min: 650, max: 749, label: 'Reliable', accessPercent: 0.75, color: '#3B82F6' },
    { min: 500, max: 649, label: 'Building Trust', accessPercent: 0.65, color: '#F59E0B' },
    { min: 0, max: 499, label: 'New', accessPercent: 0.50, color: '#EF4444' },
];

const SETTLEMENT_BUFFER = 0.25;   // 25% held until platform settles
const PLATFORM_FEE_RATE = 0.03;   // 3% platform fee
const LOAN_DEDUCTION_RATE = 0.10; // 10% for emergency loan repayment
const SAVINGS_DEDUCTION_RATE = 0.05; // 5% for micro-savings
const MAX_DEDUCTION_CAP = 0.50;   // All deductions cannot exceed 50% of accessible amount

class CashoutRulesEngine {
    /**
     * Calculate the full cashout breakdown for a user
     * @param {string} userId
     * @returns {Promise<object>} Full breakdown with amounts and deductions
     */
    static async calculateBreakdown(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                walletBalance: true,
                gigScore: true,
                creditLines: {
                    where: { status: 'ACTIVE', outstandingAmount: { gt: 0 } }
                },
                savingsGoals: {
                    where: { isCompleted: false }
                }
            }
        });

        if (!user) throw new Error('User not found');

        const walletBalancePaise = Number(user.walletBalance);
        const gigScore = user.gigScore || 600;

        // ---- Layer 1: Settlement Buffer ----
        const lockedAmount = Math.round(walletBalancePaise * SETTLEMENT_BUFFER);
        const unlockedPool = walletBalancePaise - lockedAmount;

        // ---- Layer 2: GigScore Access Tier ----
        const tier = GIGSCORE_TIERS.find(t => gigScore >= t.min && gigScore <= t.max) || GIGSCORE_TIERS[3];
        const accessibleAmount = Math.round(unlockedPool * tier.accessPercent);

        // ---- Layer 3: Auto-Deductions ----
        const platformFee = Math.round(accessibleAmount * PLATFORM_FEE_RATE);

        let loanDeduction = 0;
        let hasActiveLoan = false;
        if (user.creditLines.length > 0) {
            hasActiveLoan = true;
            const outstandingTotal = user.creditLines.reduce(
                (sum, cl) => sum + Number(cl.outstandingAmount), 0
            );
            loanDeduction = Math.min(
                Math.round(accessibleAmount * LOAN_DEDUCTION_RATE),
                outstandingTotal
            );
        }

        let savingsDeduction = 0;
        let hasActiveSavings = false;
        if (user.savingsGoals.length > 0) {
            hasActiveSavings = true;
            const goal = user.savingsGoals[0];
            const remaining = Number(goal.targetAmount) - Number(goal.currentAmount);
            savingsDeduction = Math.min(
                Math.round(accessibleAmount * SAVINGS_DEDUCTION_RATE),
                remaining
            );
        }

        // ---- Layer 4: 50% Floor Guarantee ----
        let totalDeductions = platformFee + loanDeduction + savingsDeduction;
        const maxAllowedDeduction = Math.round(accessibleAmount * MAX_DEDUCTION_CAP);

        if (totalDeductions > maxAllowedDeduction) {
            // Scale down proportionally, platform fee takes priority
            const excess = totalDeductions - maxAllowedDeduction;
            const nonFeeDeductions = loanDeduction + savingsDeduction;

            if (nonFeeDeductions > 0) {
                const scaleDown = Math.max(0, nonFeeDeductions - excess) / nonFeeDeductions;
                loanDeduction = Math.round(loanDeduction * scaleDown);
                savingsDeduction = Math.round(savingsDeduction * scaleDown);
            }

            totalDeductions = platformFee + loanDeduction + savingsDeduction;
        }

        const workerReceives = accessibleAmount - totalDeductions;

        return {
            walletBalance: walletBalancePaise,
            gigScore,
            tier: {
                label: tier.label,
                accessPercent: Math.round(tier.accessPercent * 100),
                color: tier.color
            },
            breakdown: {
                lockedAmount,        // Held for settlement
                unlockedPool,        // After settlement buffer
                accessibleAmount,    // After GigScore tier
                platformFee,         // 3% fee
                loanDeduction,       // Emergency fund repayment
                savingsDeduction,    // Micro-savings
                totalDeductions,
                workerReceives       // Final amount worker gets
            },
            flags: {
                hasActiveLoan,
                hasActiveSavings,
                floorApplied: totalDeductions >= maxAllowedDeduction
            }
        };
    }
}

module.exports = CashoutRulesEngine;
