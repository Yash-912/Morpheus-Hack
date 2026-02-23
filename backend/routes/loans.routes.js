// ============================================================
// Loans Routes — eligibility, apply, active, history, repay
// ============================================================

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const kycMiddleware = require('../middleware/kyc.middleware');
const loansController = require('../controllers/loans.controller');

router.use(authMiddleware);

// GET /api/loans/eligibility (auth + KYC)
router.get('/eligibility', kycMiddleware, loansController.checkEligibility);

// POST /api/loans/apply (auth + KYC)
router.post(
  '/apply',
  kycMiddleware,
  [
    body('amount').isInt({ min: 50000 }).withMessage('Minimum loan is ₹500 (50000 paise)'),
    body('repaymentPercent').isInt({ min: 5, max: 20 }).withMessage('Repayment percent must be 5-20'),
  ],
  validate,
  loansController.applyLoan
);

// GET /api/loans/active
router.get('/active', loansController.getActive);

// GET /api/loans/history
router.get(
  '/history',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  loansController.getHistory
);

// POST /api/loans/:loanId/repay
router.post(
  '/:loanId/repay',
  [
    param('loanId').isUUID().withMessage('Invalid loan ID'),
    body('amount').isInt({ min: 100 }).withMessage('Minimum repayment is ₹1 (100 paise)'),
  ],
  validate,
  loansController.repay
);

module.exports = router;
