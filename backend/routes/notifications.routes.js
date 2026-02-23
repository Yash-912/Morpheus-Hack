// ============================================================
// Notifications Routes — list, unread-count, mark-read, fcm-token
// ============================================================

const { Router } = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const notificationsController = require('../controllers/notifications.controller');

const router = Router();

// All routes require auth
router.use(authMiddleware);

// GET /api/notifications — paginated history
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  notificationsController.list
);

// GET /api/notifications/unread-count
router.get('/unread-count', notificationsController.unreadCount);

// POST /api/notifications/mark-read — mark ids or all
router.post(
  '/mark-read',
  [
    body('ids').optional().isArray(),
    body('ids.*').optional().isUUID(),
    body('all').optional().isBoolean(),
  ],
  validate,
  notificationsController.markRead
);

// POST /api/notifications/fcm-token — register/update FCM token
router.post(
  '/fcm-token',
  [body('token').isString().isLength({ min: 10 }).withMessage('Valid FCM token required')],
  validate,
  notificationsController.registerFcmToken
);

module.exports = router;
