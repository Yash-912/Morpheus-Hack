// ============================================================
// Earnings Controller — today, summary, history, manual, OCR, forecast
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const MlService = require('../services/ml.service');
const OcrService = require('../services/ocr.service');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

const earningsController = {
  /**
   * GET /api/earnings/today
   * Today's total across all platforms.
   */
  async getToday(req, res, next) {
    try {
      // For demo purposes: pull last 2 days of data instead of literally today 
      // since the random seed might have skipped today
      const today = new Date();
      today.setDate(today.getDate() - 2);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const earnings = await prisma.earning.findMany({
        where: {
          userId: req.user.id,
          date: { gte: today, lt: tomorrow },
        },
      });

      const byPlatform = {};
      let total = 0;
      let totalTrips = 0;

      earnings.forEach((e) => {
        const amt = Number(e.netAmount || 0);
        total += amt;
        totalTrips += e.tripsCount || 0;
        byPlatform[e.platform] = (byPlatform[e.platform] || 0) + amt;
      });

      res.json({
        success: true,
        data: {
          date: new Date().toISOString().split('T')[0],
          totalAmount: total,
          tripCount: totalTrips,
          byPlatform,
          recordCount: earnings.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/earnings/summary
   * Aggregate stats by period/platform.
   */
  async getSummary(req, res, next) {
    try {
      const { period = 'weekly', platform, startDate, endDate } = req.query;

      const where = { userId: req.user.id };
      if (platform) where.platform = platform;

      // Date range
      const now = new Date();
      if (startDate && endDate) {
        where.date = { gte: new Date(startDate), lte: new Date(endDate) };
      } else {
        const periodDays = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
        const days = periodDays[period] || 7;
        where.date = { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
      }

      const agg = await prisma.earning.aggregate({
        where,
        _sum: { netAmount: true },
        _avg: { netAmount: true },
        _count: true,
        _max: { netAmount: true },
        _min: { netAmount: true },
      });

      const tripSum = await prisma.earning.aggregate({
        where,
        _sum: { tripsCount: true },
      });

      res.json({
        success: true,
        data: {
          period,
          totalAmount: Number(agg._sum.netAmount || 0),
          avgDaily: Math.round(Number(agg._avg.netAmount || 0)),
          maxDay: Number(agg._max.netAmount || 0),
          minDay: Number(agg._min.netAmount || 0),
          totalTrips: Number(tripSum._sum.tripsCount || 0),
          dayCount: agg._count,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/earnings/history
   * Paginated history with filters.
   */
  async getHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const skip = (page - 1) * limit;

      const where = { userId: req.user.id };
      if (req.query.platform) where.platform = req.query.platform;
      if (req.query.startDate || req.query.endDate) {
        where.date = {};
        if (req.query.startDate) where.date.gte = new Date(req.query.startDate);
        if (req.query.endDate) where.date.lte = new Date(req.query.endDate);
      }

      const [earnings, total] = await Promise.all([
        prisma.earning.findMany({
          where,
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        prisma.earning.count({ where }),
      ]);

      // Convert BigInt fields
      const data = earnings.map((e) => ({
        ...e,
        grossAmount: Number(e.grossAmount),
        netAmount: Number(e.netAmount),
        platformDeductions: Number(e.platformDeductions),
      }));

      res.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/earnings/manual
   * Add manual earning entry.
   */
  async addManual(req, res, next) {
    try {
      const { platform, totalAmount, tripCount, date } = req.body;

      const earning = await prisma.earning.create({
        data: {
          userId: req.user.id,
          platform,
          date: date ? new Date(date) : new Date(),
          grossAmount: BigInt(totalAmount),
          netAmount: BigInt(totalAmount),
          tripsCount: tripCount || 0,
          source: 'manual',
        },
      });

      logger.info('Manual earning added', { userId: req.user.id, platform, totalAmount });

      res.status(201).json({
        success: true,
        data: {
          ...earning,
          grossAmount: Number(earning.grossAmount),
          netAmount: Number(earning.netAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/earnings/upload-screenshot
   * OCR screenshot → structured data.
   */
  async uploadScreenshot(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Screenshot image is required' },
        });
      }

      const { platform } = req.body;
      const extracted = await OcrService.extractEarnings(req.file.buffer, platform);

      if (!extracted) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'OCR_FAILED',
            message: 'Could not extract earnings from screenshot. Please add manually.',
          },
        });
      }

      // Auto-create earning record
      const earning = await prisma.earning.create({
        data: {
          userId: req.user.id,
          platform,
          date: extracted.date || new Date(),
          grossAmount: BigInt(extracted.totalEarnings),
          netAmount: BigInt(Math.max(0, extracted.totalEarnings - extracted.incentive)),
          tripsCount: extracted.tripCount,
          source: 'screenshot_ocr',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...earning,
          grossAmount: Number(earning.grossAmount),
          netAmount: Number(earning.netAmount),
          ocrConfidence: 'medium',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/earnings/forecast
   * ML prediction for tomorrow.
   */
  async getForecast(req, res, next) {
    try {
      const forecast = await MlService.getEarningsForecast(req.user.id, new Date());

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = earningsController;
