// ============================================================
// Earning Model Helper — Daily earnings queries & statistics
// ============================================================

const prisma = require('../config/database');

const EarningHelper = {
  // -----------------------------------------------------------
  // Get daily summary for a user on a specific date
  // -----------------------------------------------------------
  async getDailySummary(userId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const earnings = await prisma.earning.findMany({
      where: {
        userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { platform: 'asc' },
    });

    const summary = {
      date: startOfDay,
      totalGross: BigInt(0),
      totalDeductions: BigInt(0),
      totalNet: BigInt(0),
      totalHours: 0,
      totalTrips: 0,
      byPlatform: {},
      entries: earnings,
    };

    for (const e of earnings) {
      summary.totalGross += e.grossAmount;
      summary.totalDeductions += e.platformDeductions;
      summary.totalNet += e.netAmount;
      summary.totalHours += e.hoursWorked || 0;
      summary.totalTrips += e.tripsCount || 0;

      summary.byPlatform[e.platform] = {
        gross: Number(e.grossAmount),
        net: Number(e.netAmount),
        hours: e.hoursWorked || 0,
        trips: e.tripsCount || 0,
      };
    }

    // Convert BigInt to Number for JSON serialization
    summary.totalGross = Number(summary.totalGross);
    summary.totalDeductions = Number(summary.totalDeductions);
    summary.totalNet = Number(summary.totalNet);

    return summary;
  },

  // -----------------------------------------------------------
  // Get monthly stats for a user (aggregated)
  // -----------------------------------------------------------
  async getMonthlyStats(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const result = await prisma.earning.aggregate({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        grossAmount: true,
        netAmount: true,
        platformDeductions: true,
        hoursWorked: true,
        tripsCount: true,
      },
      _count: true,
    });

    // Per-platform breakdown
    const byPlatform = await prisma.earning.groupBy({
      by: ['platform'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        grossAmount: true,
        netAmount: true,
        hoursWorked: true,
        tripsCount: true,
      },
      _count: true,
    });

    return {
      month,
      year,
      totalGross: Number(result._sum.grossAmount || 0),
      totalNet: Number(result._sum.netAmount || 0),
      totalDeductions: Number(result._sum.platformDeductions || 0),
      totalHours: result._sum.hoursWorked || 0,
      totalTrips: result._sum.tripsCount || 0,
      workingDays: result._count,
      byPlatform: byPlatform.map((p) => ({
        platform: p.platform,
        gross: Number(p._sum.grossAmount || 0),
        net: Number(p._sum.netAmount || 0),
        hours: p._sum.hoursWorked || 0,
        trips: p._sum.tripsCount || 0,
        days: p._count,
      })),
    };
  },

  // -----------------------------------------------------------
  // Get paginated earning history
  // -----------------------------------------------------------
  async getHistory(userId, { page = 1, limit = 20, platform, startDate, endDate } = {}) {
    const where = { userId };
    if (platform) where.platform = platform;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.earning.count({ where }),
    ]);

    return {
      data: earnings.map((e) => ({
        ...e,
        grossAmount: Number(e.grossAmount),
        platformDeductions: Number(e.platformDeductions),
        netAmount: Number(e.netAmount),
        avgPerTrip: e.avgPerTrip ? Number(e.avgPerTrip) : null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // -----------------------------------------------------------
  // Get average daily earnings for last N days (for loan eligibility)
  // -----------------------------------------------------------
  async getAvgDailyEarnings(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await prisma.earning.aggregate({
      where: {
        userId,
        date: { gte: since },
      },
      _sum: { netAmount: true },
      _count: true,
    });

    const totalNet = Number(result._sum.netAmount || 0);
    const workingDays = result._count || 1;

    return {
      avgDaily: Math.round(totalNet / Math.min(days, workingDays)),
      totalNet,
      workingDays,
      period: days,
    };
  },

  // -----------------------------------------------------------
  // Upsert an earning record (for platform sync)
  // -----------------------------------------------------------
  async upsertEarning(userId, platform, date, data) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Find existing earning for this user/platform/date
    const existing = await prisma.earning.findFirst({
      where: { userId, platform, date: dateOnly },
    });

    if (existing) {
      return prisma.earning.update({
        where: { id: existing.id },
        data: {
          grossAmount: data.grossAmount,
          platformDeductions: data.platformDeductions || 0,
          netAmount: data.netAmount,
          hoursWorked: data.hoursWorked,
          tripsCount: data.tripsCount,
          avgPerTrip: data.avgPerTrip,
          zone: data.zone,
          source: data.source || 'api',
          verified: data.verified || false,
        },
      });
    }

    return prisma.earning.create({
      data: {
        userId,
        platform,
        date: dateOnly,
        grossAmount: data.grossAmount,
        platformDeductions: data.platformDeductions || 0,
        netAmount: data.netAmount,
        hoursWorked: data.hoursWorked,
        tripsCount: data.tripsCount,
        avgPerTrip: data.avgPerTrip,
        zone: data.zone,
        source: data.source || 'api',
        rawScreenshotUrl: data.rawScreenshotUrl,
        verified: data.verified || false,
      },
    });
  },
};

module.exports = EarningHelper;
