// ============================================================
// Settlement Scheduler — daily settlement reconciliation (6 AM)
// ============================================================

const cron = require('node-cron');
const { settlementQueue } = require('../queues');
const { prisma } = require('../../config/database');
const logger = require('../../utils/logger.utils');

/**
 * Runs at 6 AM daily.
 * Enqueues settlement reconciliation jobs for all pending settlements.
 */
function startSettlementScheduler() {
  cron.schedule('0 6 * * *', async () => {
    logger.info('Settlement scheduler triggered — 6 AM daily run');

    try {
      // Count pending settlements to decide batch strategy
      const pendingCount = await prisma.payout.count({
        where: {
          status: 'completed',
          settledAt: null,
          settlementExpectedAt: { lt: new Date() },
        },
      });

      if (pendingCount === 0) {
        logger.info('Settlement scheduler: no pending settlements');
        return;
      }

      // Enqueue a reconciliation job
      const batchId = `settlement-${Date.now()}`;
      await settlementQueue.add(
        { batchId },
        {
          jobId: batchId, // prevent duplicate runs
          priority: 2,
        }
      );

      logger.info('Settlement reconciliation job enqueued', {
        batchId,
        pendingCount,
      });
    } catch (error) {
      logger.error('Settlement scheduler failed', { error: error.message });
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('Settlement scheduler registered — runs at 6:00 AM IST daily');
}

module.exports = { startSettlementScheduler };
