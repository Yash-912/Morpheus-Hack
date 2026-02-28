// ============================================================
// Payouts Routes — balance, fee-preview, initiate, status, history
// ============================================================

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const biometricMiddleware = require('../middleware/biometric.middleware');
const { payoutLimiter } = require('../middleware/rateLimiter.middleware');
const payoutsController = require('../controllers/payouts.controller');

// All payout routes require authentication
router.use(authMiddleware);

// GET /api/payouts/balance
router.get('/balance', payoutsController.getBalance);

// GET /api/payouts/cashout-preview (Rule-based withdrawal breakdown)
router.get('/cashout-preview', payoutsController.cashoutPreview);

// GET /api/payouts/fee-preview
router.get(
  '/fee-preview',
  [
    query('amount').isInt({ min: 1 }).withMessage('Amount is required (paise)'),
    query('type').optional().isIn(['standard', 'instant']),
  ],
  validate,
  payoutsController.feePreview
);

// POST /api/payouts/initiate (auth + rate limit)
router.post(
  '/initiate',
  payoutLimiter,
  [
    body('amount').isInt({ min: 100 }).withMessage('Minimum payout is ₹1 (100 paise)'),
    body('type').optional().isIn(['standard', 'instant']),
  ],
  validate,
  payoutsController.initiate
);

// GET /api/payouts/status/:payoutId
router.get(
  '/status/:payoutId',
  [param('payoutId').isUUID().withMessage('Invalid payout ID')],
  validate,
  payoutsController.getStatus
);

// GET /api/payouts/history
router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'reversed', 'queued']),
  ],
  validate,
  payoutsController.getHistory
);

// DEMO ONLY — simulates T+7 platform settlement
router.post(
  '/simulate-settlement',
  [
    body('earningId').notEmpty().withMessage('earningId is required'),
    body('amount').isInt({ min: 1 }).withMessage('Amount is required (paise)'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const StripeService = require('../services/stripe.service');
      const result = await StripeService.simulatePlatformSettlement(req.body.earningId, req.body.amount);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
