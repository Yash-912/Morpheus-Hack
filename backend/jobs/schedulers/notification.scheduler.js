// ============================================================
// Notification Scheduler — daily digest + reminders (8 AM IST)
// ============================================================

const cron = require('node-cron');
const { prisma } = require('../../config/database');
const { notificationQueue } = require('../queues');
const { formatCurrency, getFY } = require('../../utils/formatters.utils');
const logger = require('../../utils/logger.utils');

/**
 * Runs at 8 AM daily (IST).
 * - Daily earnings digest for active users
 * - Tax deadline reminders (near March 31 / July 31)
 * - Insurance expiry alerts
 */
function startNotificationScheduler() {
  cron.schedule('0 8 * * *', async () => {
    logger.info('Notification scheduler triggered — 8 AM daily digest');

    try {
      await Promise.all([
        sendEarningsDigest(),
        sendTaxReminders(),
        sendInsuranceExpiryAlerts(),
      ]);

      logger.info('Notification scheduler completed');
    } catch (error) {
      logger.error('Notification scheduler failed', { error: error.message });
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('Notification scheduler registered — runs at 8:00 AM IST daily');
}

/**
 * Send yesterday's earnings summary to active users.
 */
async function sendEarningsDigest() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Get users who had earnings yesterday
    const earningsByUser = await prisma.earning.groupBy({
      by: ['userId'],
      where: {
        date: { gte: yesterday, lte: endOfYesterday },
      },
      _sum: { amount: true },
      _count: true,
    });

    let sent = 0;
    for (const entry of earningsByUser) {
      const totalEarnings = Number(entry._sum.amount || 0);
      if (totalEarnings <= 0) continue;

      await notificationQueue.add({
        userId: entry.userId,
        notification: {
          type: 'daily_digest',
          title: "Yesterday's Earnings 📊",
          body: `You earned ${formatCurrency(totalEarnings)} across ${entry._count} entries yesterday. Keep it up!`,
          data: { screen: 'earnings' },
        },
        channels: ['in_app'],
      });
      sent++;
    }

    logger.info(`Earnings digest sent to ${sent} users`);
  } catch (error) {
    logger.error('Earnings digest failed', { error: error.message });
  }
}

/**
 * Send tax filing deadline reminders.
 * Key dates: March 31 (FY end), July 31 (ITR filing deadline).
 */
async function sendTaxReminders() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-indexed
    const day = now.getDate();

    // Check if we're near tax deadlines
    const isNearFYEnd = (month === 3 && day >= 25); // Last week of March
    const isNearITRDeadline = (month === 7 && day >= 25); // Last week of July

    if (!isNearFYEnd && !isNearITRDeadline) return;

    const message = isNearFYEnd
      ? 'The financial year is ending soon! Make sure all your expenses and earnings are recorded for accurate tax filing.'
      : 'ITR filing deadline is approaching on July 31! File your tax return through GigPay to avoid penalties.';

    const title = isNearFYEnd
      ? 'Financial Year Ending Soon 📅'
      : 'ITR Filing Deadline Approaching ⏰';

    // Get all active users
    const activeUsers = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
      take: 10000,
    });

    for (const user of activeUsers) {
      await notificationQueue.add({
        userId: user.id,
        notification: {
          type: 'tax_reminder',
          title,
          body: message,
          data: { screen: 'tax' },
        },
        channels: ['in_app', 'push'],
      });
    }

    logger.info(`Tax reminders sent to ${activeUsers.length} users`);
  } catch (error) {
    logger.error('Tax reminders failed', { error: error.message });
  }
}

/**
 * Send alerts for insurance policies expiring in the next 7 days.
 */
async function sendInsuranceExpiryAlerts() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringPolicies = await prisma.insurancePolicy.findMany({
      where: {
        status: 'active',
        expiresAt: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        user: { select: { id: true } },
      },
    });

    for (const policy of expiringPolicies) {
      const daysLeft = Math.ceil(
        (policy.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      await notificationQueue.add({
        userId: policy.userId,
        notification: {
          type: 'insurance_expiry',
          title: 'Insurance Expiring Soon 🛡️',
          body: `Your ${policy.type} insurance expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now to stay protected.`,
          data: { screen: 'insurance', policyId: policy.id },
        },
        channels: ['in_app', 'push'],
      });
    }

    logger.info(`Insurance expiry alerts sent for ${expiringPolicies.length} policies`);
  } catch (error) {
    logger.error('Insurance expiry alerts failed', { error: error.message });
  }
}

module.exports = { startNotificationScheduler };
