// ============================================================
// Payout Model Helper — Payout queries, settlement tracking
// ============================================================

const prisma = require('../config/database');

const PayoutHelper = {
  // -----------------------------------------------------------
  // Get pending settlements (payouts expected but not yet settled)
  // -----------------------------------------------------------
  async getPendingSettlements() {
    return prisma.payout.findMany({
      where: {
        status: 'completed',
        settledAt: null,
        settlementExpectedAt: { lte: new Date() },
      },
      include: { user: { select: { id: true, phone: true, name: true } } },
      orderBy: { settlementExpectedAt: 'asc' },
    });
  },

  // -----------------------------------------------------------
  // Get payout history for a user (paginated)
  // -----------------------------------------------------------
  async getHistory(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payoutEarnings: { include: { earning: true } },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      data: payouts.map(PayoutHelper.serialize),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // -----------------------------------------------------------
  // Get daily withdrawal total for a user (limit enforcement)
  // -----------------------------------------------------------
  async getDailyWithdrawalTotal(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await prisma.payout.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay },
        status: { in: ['pending', 'processing', 'completed'] },
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: Number(result._sum.amount || 0),
      count: result._count,
    };
  },

  // -----------------------------------------------------------
  // Create a new payout record with associated earnings
  // -----------------------------------------------------------
  async createPayout(data) {
    const { earningIds, ...payoutData } = data;

    return prisma.payout.create({
      data: {
        ...payoutData,
        payoutEarnings: earningIds?.length
          ? {
              create: earningIds.map((earningId) => ({
                earningId,
              })),
            }
          : undefined,
      },
      include: { payoutEarnings: true },
    });
  },

  // -----------------------------------------------------------
  // Update payout status (called from Razorpay webhook)
  // -----------------------------------------------------------
  async updateStatus(payoutId, status, extra = {}) {
    const data = { status, ...extra };

    if (status === 'completed') {
      data.completedAt = new Date();
    }

    return prisma.payout.update({
      where: { id: payoutId },
      data,
    });
  },

  // -----------------------------------------------------------
  // Find payout by Razorpay ID (webhook lookup)
  // -----------------------------------------------------------
  async findByRazorpayId(razorpayPayoutId) {
    return prisma.payout.findFirst({
      where: { razorpayPayoutId },
      include: { user: true },
    });
  },

  // -----------------------------------------------------------
  // Count recent payouts for fraud detection
  // -----------------------------------------------------------
  async countRecentPayouts(userId, hoursBack = 1) {
    const since = new Date();
    since.setHours(since.getHours() - hoursBack);

    return prisma.payout.count({
      where: {
        userId,
        createdAt: { gte: since },
        status: { in: ['pending', 'processing', 'completed'] },
      },
    });
  },

  // -----------------------------------------------------------
  // Serialize payout for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(payout) {
    if (!payout) return null;
    return {
      ...payout,
      amount: Number(payout.amount),
      fee: Number(payout.fee),
      netAmount: Number(payout.netAmount),
    };
  },
};

module.exports = PayoutHelper;
