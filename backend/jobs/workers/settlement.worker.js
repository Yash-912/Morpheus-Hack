// ============================================================
// Settlement Worker — reconcile platform settlements
// ============================================================

const { settlementQueue } = require('../queues');
const { prisma } = require('../../config/database');
const PlatformService = require('../../services/platform.service');
const logger = require('../../utils/logger.utils');

/**
 * Reconcile settlements.
 * Queries Payouts where settlement_expected_at < now AND settled_at IS NULL.
 * For each: checks platform API if funds transferred →
 * mark settled_at = now, update revolving credit → log discrepancies.
 */
settlementQueue.process(async (job) => {
  const { batchId } = job.data;

  logger.info('Settlement worker processing', { batchId, jobId: job.id });

  try {
    // Find all payouts awaiting settlement
    const pendingSettlements = await prisma.payout.findMany({
      where: {
        status: 'completed',
        settledAt: null,
        settlementExpectedAt: { lt: new Date() },
      },
      include: {
        user: {
          select: { id: true, platformAccounts: true },
        },
      },
      take: 100, // process in batches
    });

    if (pendingSettlements.length === 0) {
      logger.info('No pending settlements to reconcile');
      return { processed: 0, settled: 0, discrepancies: 0 };
    }

    let settled = 0;
    let discrepancies = 0;

    for (const payout of pendingSettlements) {
      try {
        // Check with the platform if settlement has occurred
        const platformAccount = payout.user.platformAccounts?.find(
          (pa) => pa.platform === payout.platform
        );

        if (!platformAccount) {
          logger.warn('No platform account for settlement check', {
            payoutId: payout.id,
            platform: payout.platform,
          });
          discrepancies++;
          continue;
        }

        // Attempt to verify settlement via platform API
        const settlementStatus = await PlatformService.checkSettlementStatus(
          'generic',
          platformAccount.accessToken,
          payout.razorpayPayoutId
        );

        if (settlementStatus?.settled) {
          // Mark as settled
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              settledAt: new Date(),
            },
          });

          // Update wallet — the platform has released funds
          await prisma.user.update({
            where: { id: payout.userId },
            data: {
              walletLifetimeWithdrawn: { increment: payout.amount },
            },
          });

          settled++;
          logger.info('Settlement confirmed', { payoutId: payout.id });
        } else if (settlementStatus?.failed) {
          // Settlement failed — log discrepancy for manual review
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              failureReason: `Settlement failed: ${settlementStatus.reason || 'Unknown'}`,
            },
          });
          discrepancies++;
          logger.warn('Settlement discrepancy', {
            payoutId: payout.id,
            reason: settlementStatus.reason,
          });
        }
        // else: still pending, will be checked again next run
      } catch (err) {
        logger.error('Settlement check failed for payout', {
          payoutId: payout.id,
          error: err.message,
        });
        discrepancies++;
      }
    }

    const result = {
      processed: pendingSettlements.length,
      settled,
      discrepancies,
      batchId,
    };

    logger.info('Settlement reconciliation complete', result);
    return result;
  } catch (error) {
    logger.error('Settlement worker failed', { error: error.message, batchId });
    throw error;
  }
});

settlementQueue.on('completed', (job, result) => {
  logger.info(`Settlement job #${job.id} completed`, result);
});

module.exports = settlementQueue;
