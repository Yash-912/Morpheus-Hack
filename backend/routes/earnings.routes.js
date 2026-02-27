// ============================================================
// Earnings Routes — today, summary, history, manual, OCR, forecast
// ============================================================

const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const earningsController = require('../controllers/earnings.controller');

// All earnings routes require authentication
router.use(authMiddleware);

// GET /api/earnings/today
router.get('/today', earningsController.getToday);

// GET /api/earnings/summary
router.get(
  '/summary',
  [
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']),
    query('platform').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  earningsController.getSummary
);

// GET /api/earnings/history
router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('platform').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  earningsController.getHistory
);

// POST /api/earnings/manual
router.post(
  '/manual',
  [
    body('platform').notEmpty().withMessage('Platform is required'),
    body('totalAmount').isInt({ min: 1 }).withMessage('Amount must be a positive integer (paise)'),
    body('tripCount').optional().isInt({ min: 0 }),
    body('date').optional().isISO8601(),
  ],
  validate,
  earningsController.addManual
);

// POST /api/earnings/upload-screenshot
router.post(
  '/upload-screenshot',
  uploadSingle('screenshot'),
  [body('platform').notEmpty().withMessage('Platform is required')],
  validate,
  earningsController.uploadScreenshot
);

// GET /api/earnings/forecast
router.get('/forecast', earningsController.getForecast);

// POST /api/earnings/sync-sms — LAYER 1: detect earnings from SMS messages
router.post(
  '/sync-sms',
  [
    body('messages').isArray({ min: 1 }).withMessage('messages array is required'),
  ],
  validate,
  earningsController.syncEarningsFromSms
);

module.exports = router;
