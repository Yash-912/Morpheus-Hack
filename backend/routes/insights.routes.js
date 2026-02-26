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
    next(error);
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
