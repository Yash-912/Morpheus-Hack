// ============================================================
// Tax Routes — summary, deductions, calculate, file, status
// ============================================================

const { Router } = require('express');
const { param, body, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const kycMiddleware = require('../middleware/kyc.middleware');
const taxController = require('../controllers/tax.controller');

const router = Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/tax/summary/:fy — full tax summary
router.get(
  '/summary/:fy',
  [param('fy').matches(/^\d{4}-\d{4}$/).withMessage('FY format must be YYYY-YYYY')],
  validate,
  taxController.summary
);

// GET /api/tax/deductions/:fy — itemized deductions
router.get(
  '/deductions/:fy',
  [param('fy').matches(/^\d{4}-\d{4}$/).withMessage('FY format must be YYYY-YYYY')],
  validate,
  taxController.deductions
);

// POST /api/tax/calculate — compute tax with optional extra deductions
router.post(
  '/calculate',
  [
    body('fy').matches(/^\d{4}-\d{4}$/).withMessage('FY format must be YYYY-YYYY'),
    body('extraDeductions').optional().isArray(),
    body('extraDeductions.*.section').optional().isString(),
    body('extraDeductions.*.amount').optional().isInt({ min: 0 }),
  ],
  validate,
  taxController.calculate
);

// POST /api/tax/file — submit via ClearTax
router.post(
  '/file',
  kycMiddleware,
  [body('fy').matches(/^\d{4}-\d{4}$/).withMessage('FY format must be YYYY-YYYY')],
  validate,
  taxController.file
);

// GET /api/tax/filing-status/:fy
router.get(
  '/filing-status/:fy',
  [param('fy').matches(/^\d{4}-\d{4}$/).withMessage('FY format must be YYYY-YYYY')],
  validate,
  taxController.filingStatus
);

module.exports = router;
