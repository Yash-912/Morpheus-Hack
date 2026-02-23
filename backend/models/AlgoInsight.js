// ============================================================
// AlgoInsight Model Helper — Platform algorithm tips & crowd intel
// ============================================================

const prisma = require('../config/database');

const AlgoInsightHelper = {
  // -----------------------------------------------------------
  // Get insights filtered by platform / city / type
  // -----------------------------------------------------------
  async getInsights({ platform, city, type, page = 1, limit = 20 } = {}) {
    const where = { verified: true };
    if (platform) where.platform = platform;
    if (city) where.city = city;
    if (type) where.type = type;

    const skip = (page - 1) * limit;

    const [insights, total] = await Promise.all([
      prisma.algoInsight.findMany({
        where,
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          contributor: { select: { id: true, name: true } },
        },
      }),
      prisma.algoInsight.count({ where }),
    ]);

    return {
      insights,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // -----------------------------------------------------------
  // Submit a new insight (goes to moderation queue)
  // -----------------------------------------------------------
  async submit(userId, data) {
    return prisma.algoInsight.create({
      data: {
        contributedBy: userId,
        platform: data.platform,
        city: data.city,
        type: data.type,
        title: data.title,
        description: data.description,
        supportingData: data.supportingData || {},
        verified: false, // requires moderation
      },
    });
  },

  // -----------------------------------------------------------
  // Upvote an insight (idempotent — one per user not enforced here,
  // should be checked at API layer with a separate upvote table if needed)
  // -----------------------------------------------------------
  async upvote(insightId) {
    return prisma.algoInsight.update({
      where: { id: insightId },
      data: { upvotes: { increment: 1 } },
    });
  },

  // -----------------------------------------------------------
  // Report an insight (flag for moderation)
  // -----------------------------------------------------------
  async report(insightId) {
    return prisma.algoInsight.update({
      where: { id: insightId },
      data: { reportCount: { increment: 1 } },
    });
  },

  // -----------------------------------------------------------
  // Moderation: verify / reject insights
  // -----------------------------------------------------------
  async moderate(insightId, verified) {
    return prisma.algoInsight.update({
      where: { id: insightId },
      data: { verified },
    });
  },

  // -----------------------------------------------------------
  // Get trending insights (top upvoted in last 7 days)
  // -----------------------------------------------------------
  async getTrending(limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    return prisma.algoInsight.findMany({
      where: {
        verified: true,
        createdAt: { gte: since },
      },
      orderBy: { upvotes: 'desc' },
      take: limit,
      include: {
        contributor: { select: { id: true, name: true } },
      },
    });
  },

  // -----------------------------------------------------------
  // Get insights pending moderation
  // -----------------------------------------------------------
  async getPendingModeration(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    return prisma.algoInsight.findMany({
      where: { verified: false },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        contributor: { select: { id: true, name: true, phone: true } },
      },
    });
  },
};

module.exports = AlgoInsightHelper;
