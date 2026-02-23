// ============================================================
// Notifications Controller — list, unread count, mark read, FCM token
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

const notificationsController = {
  /**
   * GET /api/notifications
   * Paginated notification history.
   */
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId: req.user.id } }),
      ]);

      res.json({
        success: true,
        data: notifications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/notifications/unread-count
   */
  async unreadCount(req, res, next) {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.user.id, read: false },
      });

      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/notifications/mark-read
   * Mark specific ids or all as read.
   */
  async markRead(req, res, next) {
    try {
      const { ids, all } = req.body;

      if (all) {
        const result = await prisma.notification.updateMany({
          where: { userId: req.user.id, read: false },
          data: { read: true, readAt: new Date() },
        });
        return res.json({ success: true, data: { marked: result.count } });
      }

      if (ids && ids.length > 0) {
        const result = await prisma.notification.updateMany({
          where: { id: { in: ids }, userId: req.user.id, read: false },
          data: { read: true, readAt: new Date() },
        });
        return res.json({ success: true, data: { marked: result.count } });
      }

      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Provide ids array or set all: true' },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/notifications/fcm-token
   * Register or update FCM push token.
   */
  async registerFcmToken(req, res, next) {
    try {
      const { token } = req.body;

      // Upsert device token
      await prisma.user.update({
        where: { id: req.user.id },
        data: { fcmToken: token },
      });

      logger.info('FCM token registered', { userId: req.user.id });

      res.json({ success: true, message: 'FCM token registered' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationsController;
