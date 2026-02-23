// ============================================================
// Insurance Routes — plans, active, activate, claim, claims
// ============================================================

const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const kycMiddleware = require('../middleware/kyc.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const insuranceController = require('../controllers/insurance.controller');

router.use(authMiddleware);

// GET /api/insurance/plans
router.get('/plans', insuranceController.getPlans);

// GET /api/insurance/active
router.get('/active', insuranceController.getActive);

// POST /api/insurance/activate (auth + KYC)
router.post(
  '/activate',
  kycMiddleware,
  [
    body('type')
      .notEmpty()
      .isIn(['accident', 'health', 'vehicle', 'income_protection'])
      .withMessage('Invalid insurance type'),
    body('duration').isInt({ min: 30, max: 365 }).withMessage('Duration must be 30-365 days'),
  ],
  validate,
  insuranceController.activate
);

// POST /api/insurance/claim
router.post(
  '/claim',
  uploadSingle('document'),
  [
    body('policyId').isUUID().withMessage('Invalid policy ID'),
    body('type').notEmpty().withMessage('Claim type is required'),
    body('description').notEmpty().isLength({ min: 10 }).withMessage('Description must be at least 10 chars'),
    body('amount').isInt({ min: 1 }).withMessage('Claim amount is required (paise)'),
  ],
  validate,
  insuranceController.submitClaim
);

// GET /api/insurance/claims
router.get(
  '/claims',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  insuranceController.getClaims
);

module.exports = router;
