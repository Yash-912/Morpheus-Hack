// ============================================================
// Community Routes — jobs CRUD, accept, complete, confirm, rate
// ============================================================

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const { kycMiddleware } = require('../middleware/kyc.middleware');
const communityController = require('../controllers/community.controller');

const router = Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/community/jobs — nearby jobs via PostGIS
router.get(
  '/jobs',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    query('radius').optional().isInt({ min: 1, max: 50 }).withMessage('Radius 1-50 km'),
    query('type').optional().isString(),
  ],
  validate,
  communityController.nearbyJobs
);

// POST /api/community/jobs — post job with escrow
router.post(
  '/jobs',
  kycMiddleware,
  [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title 5-100 characters'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description 10-500 characters'),
    body('type').isString().withMessage('Job type required'),
    body('amount').isInt({ min: 100 }).withMessage('Amount required (paise, min ₹1)'),
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('address').optional().isString(),
  ],
  validate,
  communityController.createJob
);

// GET /api/community/my-jobs — posted and accepted jobs
router.get('/my-jobs', communityController.myJobs);

// GET /api/community/jobs/:id — job detail
router.get(
  '/jobs/:id',
  [param('id').isUUID()],
  validate,
  communityController.jobDetail
);

// POST /api/community/jobs/:id/accept
router.post(
  '/jobs/:id/accept',
  kycMiddleware,
  [param('id').isUUID()],
  validate,
  communityController.acceptJob
);

// POST /api/community/jobs/:id/complete — worker marks complete
router.post(
  '/jobs/:id/complete',
  [param('id').isUUID()],
  validate,
  communityController.completeJob
);

// POST /api/community/jobs/:id/confirm — customer confirms → release escrow
router.post(
  '/jobs/:id/confirm',
  [param('id').isUUID()],
  validate,
  communityController.confirmJob
);

// POST /api/community/jobs/:id/rate
router.post(
  '/jobs/:id/rate',
  [
    param('id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5'),
    body('review').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  communityController.rateJob
);

module.exports = router;
