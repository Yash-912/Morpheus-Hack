// ============================================================
// Insights Controller — algo insights, upvote, report, performance
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const MlService = require('../services/ml.service');

const insightsController = {
  /**
   * GET /api/insights/algo
   * Return algo insights filtered by platform/city/type.
   */
  async algoInsights(req, res, next) {
    try {
      const where = {};
      const where = {};
      if (req.query.platform) where.platform = req.query.platform;
      if (req.query.city) where.city = req.query.city;
      if (req.query.type) where.insightType = req.query.type;

      const insights = await prisma.algoInsight.findMany({
        where,
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      });

      res.json({ success: true, data: insights });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/insights/algo/:id/upvote
   */
  async upvote(req, res, next) {
    try {
      const insightId = req.params.id;

      const insight = await prisma.algoInsight.findUnique({ where: { id: insightId } });
      if (!insight) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Insight not found' },
        });
      }

      // Simple upvote increment (no toggle tracking without a vote model)
      await prisma.algoInsight.update({
        where: { id: insightId },
        data: { upvotes: { increment: 1 } },
      });

      res.json({ success: true, data: { upvoted: true } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/insights/algo/report
   * Report new pattern observation.
   */
  async report(req, res, next) {
    try {
      const { platform, city, pattern, type } = req.body;

      const insight = await prisma.algoInsight.create({
        data: {
          platform,
          city,
          insightType: type || 'idle_time',
          title: pattern.substring(0, 100),
          body: pattern,
          upvotes: 0,
        },
      });

      logger.info('Algo insight reported', {
        insightId: insight.id,
        userId: req.user.id,
        platform,
        city,
      });

      res.status(201).json({ success: true, data: insight });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/insights/performance
   * Personal analytics vs city average.
   */
  async performance(req, res, next) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      const city = user.city || 'bangalore';
      const city = user.city || 'bangalore';

      // Last 30 days analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // User stats
      const userStats = await prisma.earning.aggregate({
        where: { userId: req.user.id, date: { gte: thirtyDaysAgo } },
        _sum: { netAmount: true },
        _avg: { netAmount: true },
        _sum: { netAmount: true },
        _avg: { netAmount: true },
        _count: true,
      });

      // Days the user worked
      const userWorkDays = await prisma.earning.groupBy({
        by: ['date'],
        where: { userId: req.user.id, date: { gte: thirtyDaysAgo } },
      });

      // City average — all users in the same city
      const cityStats = await prisma.earning.aggregate({
        where: {
          user: { city },
          date: { gte: thirtyDaysAgo },
        },
        _avg: { netAmount: true },
        _avg: { netAmount: true },
      });

      // Count active users in city
      const cityUsers = await prisma.earning.groupBy({
        by: ['userId'],
        where: {
          user: { city },
          user: { city: city },
          date: { gte: thirtyDaysAgo },
        },
      });

      const userAvg = Number(userStats._avg.netAmount || 0);
      const cityAvg = Number(cityStats._avg.netAmount || 0);
      const userAvg = Number(userStats._avg.netAmount || 0);
      const cityAvg = Number(cityStats._avg.netAmount || 0);
      const comparison = cityAvg > 0
        ? Math.round(((userAvg - cityAvg) / cityAvg) * 100)
        : 0;

      res.json({
        success: true,
        data: {
          period: '30d',
          city,
          user: {
            totalEarnings: Number(userStats._sum.netAmount || 0),
            totalEarnings: Number(userStats._sum.netAmount || 0),
            avgPerEntry: userAvg,
            totalEntries: userStats._count,
            workDays: userWorkDays.length,
          },
          cityAverage: {
            avgPerEntry: cityAvg,
            activeWorkers: cityUsers.length,
          },
          comparison: {
            percentVsCity: comparison,
            label: comparison >= 0 ? 'above average' : 'below average',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = insightsController;
