// ============================================================
// Earning Model — Query helpers & business logic
// Augments Prisma with reusable earning queries.
// Usage: const EarningModel = require('../models/Earning');
// ============================================================

const { prisma } = require('../config/database');

const EarningModel = {
  /**
   * Get daily summary for a user on a specific date.
   * Returns total, per-platform breakdown, trip count.
   */
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
    });

    const byPlatform = {};
    let total = 0;
    let totalTrips = 0;

    earnings.forEach((e) => {
      const amt = Number(e.netAmount || e.grossAmount || 0);
      total += amt;
      totalTrips += e.tripsCount || 0;
      byPlatform[e.platform] = (byPlatform[e.platform] || 0) + amt;
    });

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalAmount: total,
      tripCount: totalTrips,
      byPlatform,
      recordCount: earnings.length,
    };
  },

  /**
   * Get monthly stats for a user.
   * @param {string} userId
   * @param {number} month - 1-12
   * @param {number} year
   */
  async getMonthlyStats(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const earnings = await prisma.earning.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    const byPlatform = {};
    let total = 0;
    let totalTrips = 0;
    const dailyEarnings = {};

    earnings.forEach((e) => {
      const amt = Number(e.netAmount || e.grossAmount || 0);
      total += amt;
      totalTrips += e.tripsCount || 0;
      byPlatform[e.platform] = (byPlatform[e.platform] || 0) + amt;

      const dateKey = new Date(e.date).toISOString().split('T')[0];
      dailyEarnings[dateKey] = (dailyEarnings[dateKey] || 0) + amt;
    });

    const daysWorked = Object.keys(dailyEarnings).length;
    const avgDaily = daysWorked > 0 ? Math.round(total / daysWorked) : 0;

    return {
      month,
      year,
      totalAmount: total,
      tripCount: totalTrips,
      daysWorked,
      avgDaily,
      byPlatform,
      dailyEarnings,
    };
  },

  /**
   * Get the average daily earnings for the last N days.
   * Used by loan eligibility, GigScore, etc.
   */
  async getAvgDailyLast(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const earnings = await prisma.earning.findMany({
      where: {
        userId,
        date: { gte: since },
      },
    });

    const dailyTotals = {};
    earnings.forEach((e) => {
      const dateKey = new Date(e.date).toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(e.netAmount || e.grossAmount || 0);
    });

    const values = Object.values(dailyTotals);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  },

  /**
   * Get the coefficient of variation for earnings consistency.
   * Used by GigScore calculation. Lower CV = more consistent = higher score.
   */
  async getEarningsCV(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const earnings = await prisma.earning.findMany({
      where: {
        userId,
        date: { gte: since },
      },
    });

    const dailyTotals = {};
    earnings.forEach((e) => {
      const dateKey = new Date(e.date).toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(e.netAmount || e.grossAmount || 0);
    });

    const values = Object.values(dailyTotals);
    if (values.length < 2) return 1; // Max inconsistency if not enough data

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 1;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean; // CV: 0 = perfectly consistent, higher = less consistent
  },
};

module.exports = EarningModel;
