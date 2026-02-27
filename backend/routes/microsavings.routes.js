// ============================================================
// Micro-Savings Routes — Digital Gold & Target Gullak
// ============================================================

const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const savingsCap = require('../middleware/savingsCap.middleware');
const microsavingsController = require('../controllers/microsavings.controller');

router.use(authMiddleware);

// GET /api/microsavings/portfolio — full savings overview
router.get('/portfolio', microsavingsController.getPortfolio);

// POST /api/microsavings/gold/buy — quick buy gold
router.post(
    '/gold/buy',
    [
        body('amount').isFloat({ min: 10 }).withMessage('Minimum ₹10 gold purchase'),
    ],
    validate,
    microsavingsController.buyGold
);

// POST /api/microsavings/gold/sell — emergency liquidation
router.post(
    '/gold/sell',
    [
        body('amount').isFloat({ min: 1 }).withMessage('Amount required'),
    ],
    validate,
    microsavingsController.sellGold
);

// POST /api/microsavings/gullak/create — create target savings goal
// Protected by the 10% affordability cap middleware
router.post(
    '/gullak/create',
    [
        body('title').trim().isLength({ min: 2, max: 50 }).withMessage('Goal name 2-50 characters'),
        body('targetAmount').isFloat({ min: 100 }).withMessage('Target amount required (min ₹100)'),
        body('dailyDeductionLimit').isFloat({ min: 5 }).withMessage('Daily deduction required (min ₹5)'),
    ],
    validate,
    savingsCap,
    microsavingsController.createGullak
);

module.exports = router;
