// ============================================================
// Credit Routes — Emergency Fund micro-credit
// ============================================================

const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const creditTierGate = require('../middleware/creditTierGate.middleware');
const creditController = require('../controllers/credit.controller');

router.use(authMiddleware);

// GET /api/credit/status — current limits, active loan, history
router.get('/status', creditController.getStatus);

// POST /api/credit/apply — apply for emergency fund (Tier 2+ only)
router.post(
    '/apply',
    creditTierGate,
    [
        body('amount')
            .isIn([500, 1000, 1500])
            .withMessage('Amount must be ₹500, ₹1000, or ₹1500'),
    ],
    validate,
    creditController.apply
);

module.exports = router;
