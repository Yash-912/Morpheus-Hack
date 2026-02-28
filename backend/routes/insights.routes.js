// ============================================================
// Insights Routes — algo insights, upvote, report, performance
// ============================================================

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const insightsController = require('../controllers/insights.controller');

const router = Router();
const axios = require('axios');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// All routes require auth
router.use(authMiddleware);

// GET /api/insights/weekly-summary — earnings & expense insights from last 7 days
router.get('/weekly-summary', async (req, res, next) => {
  try {
    const { prisma } = require('../config/database');
    const userId = req.user.id;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // This week's earnings
    const thisWeekEarnings = await prisma.earning.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' }
    });

    // Last week's earnings (for comparison)
    const lastWeekEarnings = await prisma.earning.findMany({
      where: { userId, date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }
    });

    // This week's expenses
    const thisWeekExpenses = await prisma.expense.findMany({
      where: { userId, date: { gte: sevenDaysAgo } }
    });

    // --- Compute insights ---
    const totalEarned = thisWeekEarnings.reduce((s, e) => s + Number(e.netAmount), 0);
    const lastWeekTotal = lastWeekEarnings.reduce((s, e) => s + Number(e.netAmount), 0);
    const totalExpenses = thisWeekExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const netIncome = totalEarned - totalExpenses;
    const workingDays = new Set(thisWeekEarnings.map(e => new Date(e.date).toDateString())).size;

    // Week-over-week change
    const weekChange = lastWeekTotal > 0
      ? Math.round(((totalEarned - lastWeekTotal) / lastWeekTotal) * 100)
      : 0;

    // Platform split
    const platformMap = {};
    thisWeekEarnings.forEach(e => {
      const p = e.platform || 'other';
      platformMap[p] = (platformMap[p] || 0) + Number(e.netAmount);
    });
    const platformSplit = Object.entries(platformMap)
      .map(([platform, amount]) => ({
        platform,
        amount,
        percent: totalEarned > 0 ? Math.round((amount / totalEarned) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Best & worst days
    const dailyMap = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    thisWeekEarnings.forEach(e => {
      const dayKey = new Date(e.date).toDateString();
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + Number(e.netAmount);
    });
    const dailyEntries = Object.entries(dailyMap)
      .map(([dateStr, amount]) => ({ date: dateStr, day: dayNames[new Date(dateStr).getDay()], amount }))
      .sort((a, b) => b.amount - a.amount);
    const bestDay = dailyEntries[0] || null;
    const worstDay = dailyEntries[dailyEntries.length - 1] || null;

    // Expense breakdown by category
    const expenseMap = {};
    thisWeekExpenses.forEach(e => {
      const cat = e.category || 'other';
      expenseMap[cat] = (expenseMap[cat] || 0) + Number(e.amount);
    });
    const expenseBreakdown = Object.entries(expenseMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Daily average
    const dailyAvg = workingDays > 0 ? Math.round(totalEarned / workingDays) : 0;

    // Generate headline
    const earnRupees = (totalEarned / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const changeText = weekChange > 0 ? `${weekChange}% up from last week` : weekChange < 0 ? `${Math.abs(weekChange)}% down from last week` : 'same as last week';
    const topPlatform = platformSplit[0]?.platform || 'delivery';
    const headline = `You earned ₹${earnRupees} this week (${changeText}). ${bestDay ? `${bestDay.day} was your strongest day.` : ''}`;

    res.json({
      success: true,
      data: {
        headline,
        totalEarned,
        totalExpenses,
        netIncome,
        weekChange,
        workingDays,
        dailyAvg,
        bestDay,
        worstDay,
        platformSplit,
        expenseBreakdown,
        dailyEntries
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/insights/financial — LLM-powered personalised financial insights
router.get('/financial', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/insights/${userId}`, {
      timeout: 30000,
    });
    res.json({ success: true, data: mlResponse.data });
  } catch (error) {
    if (error.response) {
      return res.json({ success: true, data: error.response.data });
    }

    // ML Service is offline / unreachable
    return res.json({
      success: true,
      data: {
        user_id: req.user.id,
        is_seeded: true,
        insights: [
          {
            type: "advice",
            title: "ML Service Disconnected",
            body: `The Python ML service could not be reached at ${ML_SERVICE_URL}. The AI backend is offline.`,
            action: "CD into the ml-service folder and run: uvicorn main:app --port 8000"
          }
        ]
      }
    });
  }
});

// GET /api/insights/algo — algo insights filtered by platform/city/type
router.get(
  '/algo',
  [
    query('platform').optional().isString(),
    query('city').optional().isString(),
    query('type').optional().isString(),
  ],
  validate,
  insightsController.algoInsights
);

// POST /api/insights/algo/:id/upvote
router.post(
  '/algo/:id/upvote',
  [param('id').isUUID()],
  validate,
  insightsController.upvote
);

// POST /api/insights/algo/report — report new pattern
router.post(
  '/algo/report',
  [
    body('platform').isString().withMessage('Platform required'),
    body('city').isString().withMessage('City required'),
    body('pattern').trim().isLength({ min: 10, max: 500 }).withMessage('Pattern description 10-500 characters'),
    body('type').optional().isString(),
  ],
  validate,
  insightsController.report
);

// GET /api/insights/performance — personal analytics vs city avg
router.get('/performance', insightsController.performance);

module.exports = router;
