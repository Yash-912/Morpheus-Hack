// ============================================================
// Notification Worker — multi-channel dispatch (FCM, WhatsApp, in-app)
// ============================================================

const { notificationQueue } = require('../queues');
const { prisma } = require('../../config/database');
const NotificationService = require('../../services/notification.service');
const logger = require('../../utils/logger.utils');

/**
 * Process notification dispatch jobs.
 * Job data: { userId, notification: { type, title, body, data }, channels }
 *
 * Sends via specified channels (push, whatsapp, in_app),
 * creates Notification DB record, handles delivery failures with retry.
 */
notificationQueue.process(5, async (job) => {
  const { userId, notification, channels = ['in_app', 'push'] } = job.data;

  logger.info('Notification worker processing', {
    jobId: job.id,
    userId,
    type: notification.type,
    channels,
  });

  try {
    const results = { sent: [], failed: [] };

    // In-app notification — persist to DB
    if (channels.includes('in_app')) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            type: notification.type || 'system',
            title: notification.title,
            body: notification.body,
            channel: 'in_app',
            data: notification.data || {},
          },
        });
        results.sent.push('in_app');
      } catch (err) {
        logger.error('In-app notification failed', { userId, error: err.message });
        results.failed.push('in_app');
      }
    }

    // FCM Push notification
    if (channels.includes('push')) {
      try {
        const pushSent = await NotificationService.sendPush(userId, {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        });
        if (pushSent) {
          results.sent.push('push');
        } else {
          results.failed.push('push');
        }
      } catch (err) {
        logger.error('Push notification failed', { userId, error: err.message });
        results.failed.push('push');
      }
    }

    // WhatsApp notification
    if (channels.includes('whatsapp')) {
      try {
        const waSent = await NotificationService.sendWhatsApp(
          userId,
          `*${notification.title}*\n${notification.body}`
        );
        if (waSent) {
          results.sent.push('whatsapp');
        } else {
          results.failed.push('whatsapp');
        }
      } catch (err) {
        logger.error('WhatsApp notification failed', { userId, error: err.message });
        results.failed.push('whatsapp');
      }
    }

    // Emit Socket.io event for real-time in-app updates
    const io = global.__io;
    if (io && channels.includes('in_app')) {
      io.to(`user:${userId}`).emit('notification:new', {
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        createdAt: new Date().toISOString(),
      });
    }

    logger.info('Notification worker completed', {
      jobId: job.id,
      userId,
      sent: results.sent,
      failed: results.failed,
    });

    // If all channels failed, throw to trigger retry
    if (results.sent.length === 0 && results.failed.length > 0) {
      throw new Error(`All notification channels failed: ${results.failed.join(', ')}`);
    }

    return results;
  } catch (error) {
    logger.error('Notification worker failed', {
      jobId: job.id,
      userId,
      error: error.message,
    });
    throw error;
  }
});

notificationQueue.on('completed', (job, result) => {
  logger.debug(`Notification job #${job.id} completed`, result);
});

module.exports = notificationQueue;
