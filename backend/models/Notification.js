// ============================================================
// Notification Model — Query helpers
// Usage: const NotificationModel = require('../models/Notification');
// ============================================================

const { prisma } = require('../config/database');

const NotificationModel = {
    /**
     * Get unread notifications for a user.
     * @param {string} userId
     * @param {number} limit - default 50
     */
    async getUnread(userId, limit = 50) {
        return prisma.notification.findMany({
            where: {
                userId,
                readAt: null,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },

    /**
     * Get unread count for a user.
     */
    async getUnreadCount(userId) {
        return prisma.notification.count({
            where: {
                userId,
                readAt: null,
            },
        });
    },

    /**
     * Mark specific notifications as read.
     * @param {string} userId
     * @param {string[]} ids - notification IDs to mark read. If empty, mark all.
     */
    async markRead(userId, ids = []) {
        const where = { userId, readAt: null };
        if (ids.length > 0) {
            where.id = { in: ids };
        }

        return prisma.notification.updateMany({
            where,
            data: { readAt: new Date() },
        });
    },

    /**
     * Create a notification record.
     * @param {object} data - { userId, type, title, body, data, channels }
     */
    async create({ userId, type, title, body, data = null, channels = ['in_app'] }) {
        return prisma.notification.create({
            data: {
                userId,
                type,
                title,
                body,
                data,
                channels,
            },
        });
    },

    /**
     * Delete old read notifications (cleanup, e.g., older than 90 days).
     */
    async cleanupOld(daysOld = 90) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        return prisma.notification.deleteMany({
            where: {
                readAt: { not: null },
                createdAt: { lt: cutoff },
            },
        });
    },
};

module.exports = NotificationModel;
