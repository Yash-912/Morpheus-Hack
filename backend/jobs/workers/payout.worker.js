// ============================================================
// Payout Worker — process payout disbursements via Razorpay
// ============================================================

const { payoutQueue } = require('../queues');
const { prisma } = require('../../config/database');
const RazorpayService = require('../../services/razorpay.service');
const NotificationService = require('../../services/notification.service');
const { loanRepaymentQueue } = require('../queues');
const logger = require('../../utils/logger.utils');

/**
 * Process payout jobs.
 * Job data: { payoutId, userId, amount, upiId, fundAccountId }
 *
 * Flow:
 * 1. Create/retrieve Razorpay fund account
 * 2. Initiate payout via Razorpay
 * 3. Update Payout status → processing
 * 4. Emit Socket.io event payout:processing
 * 5. On webhook completion: status → completed (handled by webhooks controller)
 * 6. On failure: status → failed, retry up to 3 times
 */
payoutQueue.process(async (job) => {
  const { payoutId, userId, amount, upiId, fundAccountId } = job.data;

  logger.info('Payout worker processing', { payoutId, userId, amount, attempt: job.attemptsMade + 1 });

  try {
    // 1. Get or create Razorpay fund account
    let activeFundAccountId = fundAccountId;

    if (!activeFundAccountId) {
      // Look up user's bank details to create fund account
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { bankAccounts: { where: { isPrimary: true }, take: 1 } },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const bankAccount = user.bankAccounts[0];

      if (bankAccount && bankAccount.razorpayFundAccountId) {
        activeFundAccountId = bankAccount.razorpayFundAccountId;
      } else if (bankAccount) {
        // Create Razorpay contact first
        let contactId = user.razorpayContactId;
        if (!contactId) {
          contactId = await RazorpayService.createContact({
            name: user.name,
            phone: user.phone,
            email: user.email,
          });
          await prisma.user.update({
            where: { id: userId },
            data: { razorpayContactId: contactId },
          });
        }

        // Create fund account
        activeFundAccountId = await RazorpayService.createFundAccount(contactId, {
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode,
          holderName: bankAccount.holderName,
        });

        // Persist for future payouts
        await prisma.bankAccount.update({
          where: { id: bankAccount.id },
          data: { razorpayFundAccountId: activeFundAccountId },
        });
      } else if (upiId) {
        // UPI-based payout — create contact + VPA fund account
        let contactId = user.razorpayContactId;
        if (!contactId) {
          contactId = await RazorpayService.createContact({
            name: user.name,
            phone: user.phone,
          });
          await prisma.user.update({
            where: { id: userId },
            data: { razorpayContactId: contactId },
          });
        }
        // For UPI fund accounts, Razorpay SDK may differ
        // This will be handled via the Razorpay API directly
        activeFundAccountId = contactId; // Placeholder; real impl uses VPA fund account
      } else {
        throw new Error('No bank account or UPI ID configured for payout');
      }
    }

    // 2. Initiate payout via Razorpay
    const { razorpayPayoutId, status } = await RazorpayService.initiatePayout({
      fundAccountId: activeFundAccountId,
      amount,
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      referenceId: payoutId,
    });

    // 3. Update payout record → processing
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'processing',
        externalId: razorpayPayoutId,
        processedAt: new Date(),
      },
    });

    // 4. Emit Socket.io event
    const io = global.__io;
    if (io) {
      io.to(`user:${userId}`).emit('payout:processing', {
        payoutId,
        razorpayPayoutId,
        amount,
        status: 'processing',
      });
    }

    // 5. Enqueue loan auto-repayment check
    await loanRepaymentQueue.add(
      { userId, payoutId, payoutAmount: amount },
      { delay: 5000 } // slight delay to let payout settle
    );

    // 6. Send confirmation notification
    await NotificationService.sendPayoutConfirmation(userId, {
      amount,
      payoutId,
      estimatedTime: '2-5 minutes',
    });

    logger.info('Payout worker completed', { payoutId, razorpayPayoutId, status });

    return { payoutId, razorpayPayoutId, status };
  } catch (error) {
    logger.error('Payout worker failed', {
      payoutId,
      error: error.message,
      attempt: job.attemptsMade + 1,
    });

    // If final attempt, mark payout as failed and refund wallet
    if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.payout.update({
            where: { id: payoutId },
            data: {
              status: 'failed',
              failureReason: error.message,
            },
          });

          // Refund amount back to wallet
          await tx.wallet.update({
            where: { userId },
            data: { balance: { increment: BigInt(amount) } },
          });
        });

        await NotificationService.sendNotification(
          userId,
          {
            type: 'payout_failed',
            title: 'Payout Failed',
            body: `Your payout could not be processed. ₹${(amount / 100).toFixed(2)} has been refunded to your wallet.`,
            data: { payoutId, screen: 'wallet' },
          },
          ['in_app', 'push']
        );

        // Emit socket event
        const io = global.__io;
        if (io) {
          io.to(`user:${userId}`).emit('payout:failed', { payoutId, reason: error.message });
        }
      } catch (refundErr) {
        logger.error('Payout refund failed — CRITICAL', { payoutId, error: refundErr.message });
      }
    }

    throw error; // Let Bull handle retry
  }
});

// Event logging
payoutQueue.on('completed', (job, result) => {
  logger.info(`Payout job #${job.id} completed`, result);
});

module.exports = payoutQueue;
