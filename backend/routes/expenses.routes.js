// ============================================================
// Expenses Routes — CRUD, summary, SMS batch, receipt OCR
// ============================================================

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const expensesController = require('../controllers/expenses.controller');

router.use(authMiddleware);

// GET /api/expenses
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  expensesController.list
);

// GET /api/expenses/summary
router.get(
  '/summary',
  [
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('year').optional().isInt({ min: 2020 }),
  ],
  validate,
  expensesController.summary
);

// POST /api/expenses
router.post(
  '/',
  [
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isInt({ min: 1 }).withMessage('Amount must be positive (paise)'),
    body('description').optional().isString(),
    body('date').optional().isISO8601(),
    body('merchant').optional().isString(),
  ],
  validate,
  expensesController.create
);

// POST /api/expenses/sms-batch
router.post(
  '/sms-batch',
  [
    body('messages').isArray({ min: 1, max: 100 }).withMessage('Messages array is required (1-100)'),
    body('messages.*.body').notEmpty().withMessage('SMS body is required'),
    body('messages.*.timestamp').optional().isISO8601(),
  ],
  validate,
  expensesController.smsBatch
);

// POST /api/expenses/receipt
router.post('/receipt', uploadSingle('receipt'), expensesController.receipt);

// DELETE /api/expenses/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid expense ID')],
  validate,
  expensesController.remove
);

module.exports = router;
