// ============================================================
// Loan Scheduler — midnight health check for overdue loans
// ============================================================

const cron = require('node-cron');
const { prisma } = require('../../config/database');
const { notificationQueue } = require('../queues');
const { formatCurrency } = require('../../utils/formatters.utils');
const logger = require('../../utils/logger.utils');

/**
 * Runs at midnight daily (IST).
 * Checks for overdue loans, updates default status, sends reminders.
 */
function startLoanScheduler() {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Loan scheduler triggered — midnight health check');

    try {
      const now = new Date();

      // 1. Find loans approaching due date (3 days warning)
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const upcomingDue = await prisma.loan.findMany({
        where: {
          status: 'active',
          dueDate: { gte: now, lte: threeDaysFromNow },
        },
      });

      for (const loan of upcomingDue) {
        const remaining = Number(loan.totalRepayable) - Number(loan.amountRepaid);

        await notificationQueue.add({
          userId: loan.userId,
          notification: {
            type: 'loan_reminder',
            title: 'Loan Repayment Reminder 📋',
            body: `Your loan repayment of ${formatCurrency(remaining)} is due by ${loan.dueDate.toLocaleDateString('en-IN')}. Enable auto-deduct for hassle-free repayment.`,
            data: { loanId: loan.id, screen: 'loans' },
          },
          channels: ['in_app', 'push'],
        });
      }

      logger.info(`Loan scheduler: sent ${upcomingDue.length} upcoming due reminders`);

      // 2. Check for overdue loans (past due date, not fully repaid)
      const overdueLoans = await prisma.loan.findMany({
        where: {
          status: 'active',
          dueDate: { lt: now },
        },
      });

      let defaulted = 0;
      for (const loan of overdueLoans) {
        const repaidPercent = Number(loan.amountRepaid) / Number(loan.totalRepayable);

        // Grace period: 7 days after due date
        const daysPastDue = Math.floor((now.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000));

        if (daysPastDue > 7 && repaidPercent < 0.9) {
          // Mark as defaulted
          await prisma.loan.update({
            where: { id: loan.id },
            data: { status: 'defaulted' },
          });

          await notificationQueue.add({
            userId: loan.userId,
            notification: {
              type: 'loan_defaulted',
              title: 'Loan Defaulted ⚠️',
              body: 'Your loan has been marked as defaulted due to non-payment. This affects your GigScore and future loan eligibility.',
              data: { loanId: loan.id, screen: 'loans' },
            },
            channels: ['in_app', 'push', 'whatsapp'],
          });

          defaulted++;
        } else if (daysPastDue <= 7) {
          // Send overdue reminder
          const remaining = Number(loan.totalRepayable) - Number(loan.amountRepaid);

          await notificationQueue.add({
            userId: loan.userId,
            notification: {
              type: 'loan_overdue',
              title: 'Loan Overdue ⚠️',
              body: `Your loan repayment of ${formatCurrency(remaining)} is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} overdue. Please pay soon to avoid default.`,
              data: { loanId: loan.id, screen: 'loans' },
            },
            channels: ['in_app', 'push'],
          });
        }
      }

      logger.info('Loan scheduler completed', {
        upcomingReminders: upcomingDue.length,
        overdueLoans: overdueLoans.length,
        defaulted,
      });
    } catch (error) {
      logger.error('Loan scheduler failed', { error: error.message });
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('Loan scheduler registered — runs at midnight IST daily');
}

module.exports = { startLoanScheduler };
