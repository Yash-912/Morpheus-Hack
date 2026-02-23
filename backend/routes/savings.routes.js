// ============================================================
// Savings Routes — goals CRUD, deposit, withdraw, toggle
// ============================================================

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const savingsController = require('../controllers/savings.controller');

const router = Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/savings — all goals
router.get('/', savingsController.list);

// POST /api/savings/create — create goal
router.post(
  '/create',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Goal name 2-50 characters'),
    body('targetAmount').isInt({ min: 100 }).withMessage('Target amount required (paise, min ₹1)'),
    body('autoSavePercent').optional().isFloat({ min: 0, max: 50 }).withMessage('Auto-save 0-50%'),
  ],
  validate,
  savingsController.create
);

// POST /api/savings/:id/deposit — manual deposit
router.post(
  '/:id/deposit',
  [
    param('id').isUUID(),
    body('amount').isInt({ min: 100 }).withMessage('Amount required (paise, min ₹1)'),
  ],
  validate,
  savingsController.deposit
);

// POST /api/savings/:id/withdraw
router.post(
  '/:id/withdraw',
  [
    param('id').isUUID(),
    body('amount').isInt({ min: 100 }).withMessage('Amount required (paise, min ₹1)'),
  ],
  validate,
  savingsController.withdraw
);

// PATCH /api/savings/:id/toggle — pause/resume auto-save
router.patch(
  '/:id/toggle',
  [param('id').isUUID()],
  validate,
  savingsController.toggle
);

module.exports = router;
