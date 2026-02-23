// ============================================================
// Notification Model Helper — In-app & push notification CRUD
// ============================================================

const prisma = require('../config/database');

const NotificationHelper = {
  // -----------------------------------------------------------
  // Get paginated notifications for a user
  // -----------------------------------------------------------
  async getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  // -----------------------------------------------------------
  // Get unread count for badge display
  // -----------------------------------------------------------
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  // -----------------------------------------------------------
  // Create a notification
  // -----------------------------------------------------------
  async create({ userId, type, title, body, channel = 'in_app', data = {} }) {
    return prisma.notification.create({
      data: { userId, type, title, body, channel, data },
    });
  },

  // -----------------------------------------------------------
  // Bulk create notifications (e.g., broadcast to multiple users)
  // -----------------------------------------------------------
  async bulkCreate(notifications) {
    return prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        channel: n.channel || 'in_app',
        data: n.data || {},
      })),
    });
  },

  // -----------------------------------------------------------
  // Mark a single notification as read
  // -----------------------------------------------------------
  async markRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  // -----------------------------------------------------------
  // Mark all notifications as read for a user
  // -----------------------------------------------------------
  async markAllRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  // -----------------------------------------------------------
  // Delete old notifications (cleanup cron — keep last 90 days)
  // -----------------------------------------------------------
  async deleteOld(daysToKeep = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    return prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: { lt: cutoff },
      },
    });
  },
};

module.exports = NotificationHelper;
