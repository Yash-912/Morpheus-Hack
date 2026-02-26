// ============================================================
// InsurancePolicy Model — Query helpers
// Usage: const InsurancePolicyModel = require('../models/InsurancePolicy');
// ============================================================

const { prisma } = require('../config/database');

const InsurancePolicyModel = {
    /**
     * Get all active policies for a user.
     */
    async getActivePolicies(userId) {
        const now = new Date();
        return prisma.insurancePolicy.findMany({
            where: {
                userId,
                status: 'active',
                validTo: { gte: now },
            },
            include: { claims: true },
            orderBy: { validTo: 'asc' },
        });
    },

    /**
     * Get policies expiring within N days (used by notification scheduler).
     */
    async getExpiringPolicies(days = 3) {
        const now = new Date();
        const threshold = new Date();
        threshold.setDate(threshold.getDate() + days);

        return prisma.insurancePolicy.findMany({
            where: {
                status: 'active',
                validTo: { gte: now, lte: threshold },
            },
            include: {
                user: { select: { id: true, phone: true, name: true, fcmToken: true } },
            },
        });
    },

    /**
     * Check if user has a specific type of active policy.
     */
    async hasActivePolicy(userId, type) {
        const now = new Date();
        const count = await prisma.insurancePolicy.count({
            where: {
                userId,
                type,
                status: 'active',
                validTo: { gte: now },
            },
        });
        return count > 0;
    },

    /**
     * Get claim history for a user across all policies.
     */
    async getClaimHistory(userId) {
        return prisma.insuranceClaim.findMany({
            where: {
                policy: { userId },
            },
            include: {
                policy: { select: { type: true, coverAmount: true, partner: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });
    },
};

module.exports = InsurancePolicyModel;
