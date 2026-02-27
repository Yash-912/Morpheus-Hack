// ============================================================
// TDS Routes — Tax Compliance Hub (Mock APIs)
// ============================================================

const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const tdsController = require('../controllers/tds.controller');

router.use(authMiddleware);

// GET /api/tds/summary/:pan — Fetch mock Form 26AS
router.get(
    '/summary/:pan',
    [
        param('pan').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
    ],
    validate,
    tdsController.getTdsSummary
);

// POST /api/tds/submit-itr — File ITR (with 2.5s mock delay)
router.post(
    '/submit-itr',
    [
        body('pan').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN'),
        body('financialYear').notEmpty().withMessage('Financial year required'),
        body('consentGiven').equals('true').withMessage('Consent required'),
    ],
    validate,
    tdsController.submitItr
);

module.exports = router;
