// ============================================================
// Route Aggregator — mounts all route files under /api
// ============================================================

const router = require('express').Router();
const { generalLimiter } = require('../middleware/rateLimiter.middleware');

// Apply general rate limiter to all API routes
router.use(generalLimiter);

// ---- Mount route modules ----
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/earnings', require('./earnings.routes'));
router.use('/payouts', require('./payouts.routes'));
router.use('/loans', require('./loans.routes'));
router.use('/insurance', require('./insurance.routes'));
router.use('/expenses', require('./expenses.routes'));
router.use('/tax', require('./tax.routes'));
router.use('/community', require('./community.routes'));
router.use('/savings', require('./savings.routes'));
router.use('/insights', require('./insights.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/forecast', require('./forecast.routes'));
router.use('/location', require('./location.routes'));
router.use('/zones', require('./zones.routes'));
router.use('/webhooks', require('./webhooks.routes'));
router.use('/sms', require('./sms.routes'));
router.use('/gigscore', require('./gigscore.routes'));
router.use('/microsavings', require('./microsavings.routes'));
router.use('/credit', require('./credit.routes'));
router.use('/tds', require('./tds.routes'));
router.use('/ai', require('./ai.routes'));

module.exports = router;
