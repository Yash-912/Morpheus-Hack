// ============================================================
// AlgoInsight Model — Query helpers
// Usage: const AlgoInsightModel = require('../models/AlgoInsight');
// ============================================================

const { prisma } = require('../config/database');

const AlgoInsightModel = {
    /**
     * Get insights filtered by platform, city, and/or type.
     * Only returns currently valid insights (validUntil in the future or null).
     */
    async getFiltered({ platform, city, insightType, limit = 20, offset = 0 }) {
        const where = {};
        if (platform) where.platform = platform;
        if (city) where.city = city;
        if (insightType) where.insightType = insightType;

        // Only show currently valid insights
        where.OR = [
            { validUntil: null },
            { validUntil: { gte: new Date() } },
        ];

        const [insights, total] = await Promise.all([
            prisma.algoInsight.findMany({
                where,
                orderBy: [
                    { isVerified: 'desc' },
                    { upvotes: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip: offset,
                take: limit,
            }),
            prisma.algoInsight.count({ where }),
        ]);

        return { insights, total };
    },

    /**
     * Increment upvote count for an insight.
     */
    async upvote(insightId) {
        return prisma.algoInsight.update({
            where: { id: insightId },
            data: { upvotes: { increment: 1 } },
        });
    },

    /**
     * Get top insights by confidence score for a platform + city combo.
     * Used by WhatsApp bot zone handler.
     */
    async getTopInsights(platform, city, limit = 5) {
        return prisma.algoInsight.findMany({
            where: {
                platform,
                city,
                OR: [
                    { validUntil: null },
                    { validUntil: { gte: new Date() } },
                ],
            },
            orderBy: { confidenceScore: 'desc' },
            take: limit,
        });
    },

    /**
     * Report a new community-sourced insight pattern.
     */
    async reportPattern({ platform, city, insightType, title, body, supportingData }) {
        return prisma.algoInsight.create({
            data: {
                platform,
                city,
                insightType,
                title,
                body,
                supportingData,
                reportedByCount: 1,
                confidenceScore: 0.3, // Low confidence until verified
                isVerified: false,
            },
        });
    },
};

module.exports = AlgoInsightModel;
