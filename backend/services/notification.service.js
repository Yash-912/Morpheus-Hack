// ============================================================
// Notification Service — Multi-channel dispatch (FCM, WhatsApp, in-app)
// ============================================================

const { fcmMessaging } = require('../config/firebase');
const prisma = require('../config/database');
const logger = require('../utils/logger.utils');
const WhatsAppService = require('./whatsapp.service');
const { formatCurrency } = require('../utils/formatters.utils');

const NotificationService = {
  /**
   * Send a push notification via Firebase Cloud Messaging.
   * @param {string} userId
   * @param {object} notification — { title, body, data? }
   */
  async sendPush(userId, { title, body, data = {} }) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user?.fcmToken || !fcmMessaging) {
        logger.debug('Push skipped — no FCM token or FCM not configured', { userId });
        return false;
      }

      await fcmMessaging.send({
        token: user.fcmToken,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        android: {
          priority: 'high',
          notification: { channelId: 'gigpay-default', sound: 'default' },
        },
        webpush: {
          notification: { icon: '/icons/icon-192.png', badge: '/icons/badge-72.png' },
        },
      });

      logger.debug('Push sent', { userId, title });
      return true;
    } catch (error) {
      // Token invalid — clear it
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        });
        logger.info('Cleared invalid FCM token', { userId });
      } else {
        logger.error('Push send failed:', error.message);
      }
      return false;
    }
  },

  /**
   * Send a WhatsApp message to a user.
   */
  async sendWhatsApp(userId, message) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });

      if (!user?.phone) return false;

      return WhatsAppService.sendMessage(user.phone, message);
    } catch (error) {
      logger.error('WhatsApp send failed:', error.message);
      return false;
    }
  },

  /**
   * Send a notification across specified channels and persist to DB.
   * @param {string} userId
   * @param {object} notification — { type, title, body, data? }
   * @param {string[]} channels — ['push', 'whatsapp', 'in_app']
   */
  async sendNotification(userId, notification, channels = ['in_app', 'push']) {
    const { type, title, body, data = {} } = notification;

    // Persist to DB (in-app)
    if (channels.includes('in_app')) {
      await prisma.notification.create({
        data: {
          userId,
          type: type || 'system',
          title,
          body,
          channel: 'in_app',
          data,
        },
      });
    }

    // FCM Push
    if (channels.includes('push')) {
      await NotificationService.sendPush(userId, { title, body, data });
    }

    // WhatsApp
    if (channels.includes('whatsapp')) {
      await NotificationService.sendWhatsApp(userId, `*${title}*\n${body}`);
    }

    logger.info('Notification dispatched', { userId, type, channels });
  },

  /**
   * Pre-built: Payout confirmation notification.
   */
  async sendPayoutConfirmation(userId, { amount, payoutId, estimatedTime }) {
    await NotificationService.sendNotification(
      userId,
      {
        type: 'payout',
        title: 'Payout Initiated! 💰',
        body: `${formatCurrency(amount)} is on its way to your bank account. Estimated arrival: ${estimatedTime}.`,
        data: { payoutId, screen: 'wallet' },
      },
      ['in_app', 'push']
    );
  },

  /**
   * Pre-built: Payout completed notification.
   */
  async sendPayoutCompleted(userId, { amount, payoutId }) {
    await NotificationService.sendNotification(
      userId,
      {
        type: 'payout',
        title: 'Money Received! ✅',
        body: `${formatCurrency(amount)} has been credited to your bank account.`,
        data: { payoutId, screen: 'wallet' },
      },
      ['in_app', 'push', 'whatsapp']
    );
  },

  /**
   * Pre-built: Hot zone alert for nearby high-demand areas.
   */
  async sendHotZoneAlert(userId, zones) {
    if (!zones || zones.length === 0) return;

    const topZone = zones[0];
    await NotificationService.sendNotification(
      userId,
      {
        type: 'hot_zone',
        title: '🔥 High Demand Nearby!',
        body: `${topZone.name || 'A zone near you'} has high demand right now. Head there for more orders!`,
        data: { screen: 'map', lat: topZone.lat, lng: topZone.lng },
      },
      ['push']
    );
  },

  /**
   * Pre-built: Loan repayment reminder.
   */
  async sendLoanReminder(userId, { loanId, amountDue, dueDate }) {
    await NotificationService.sendNotification(
      userId,
      {
        type: 'loan',
        title: 'Loan Repayment Reminder 📋',
        body: `You have ${formatCurrency(amountDue)} due by ${dueDate}. Enable auto-deduct for hassle-free repayment.`,
        data: { loanId, screen: 'loans' },
      },
      ['in_app', 'push']
    );
  },
};

module.exports = NotificationService;
