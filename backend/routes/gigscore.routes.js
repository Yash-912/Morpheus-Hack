// ============================================================
// GigScore Routes — overview, history, eligibility
// ============================================================

const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const gigscoreController = require('../controllers/gigscore.controller');

router.use(authMiddleware);

// GET /api/gigscore/overview
router.get('/overview', gigscoreController.getOverview);

// GET /api/gigscore/history
router.get('/history', gigscoreController.getHistory);

// GET /api/gigscore/eligibility
router.get('/eligibility', gigscoreController.getEligibility);

module.exports = router;
