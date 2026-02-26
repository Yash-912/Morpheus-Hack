// ============================================================
// Loan Worker — auto-repayment from successful payouts
// ============================================================

const { loanRepaymentQueue, notificationQueue } = require('../queues');
const { prisma } = require('../../config/database');
const logger = require('../../utils/logger.utils');

/**
 * Loan auto-repayment worker.
 * Triggered after each successful payout.
 * Job data: { userId, payoutId, payoutAmount }
 *
 * Checks active loan → calculates deduction (payout_amount × auto_deduct_percent) →
 * updates Loan amount_repaid + repayment_history.
 * If fully repaid: status → repaid, congratulations notification.
 */
loanRepaymentQueue.process(async (job) => {
  const { userId, payoutId, payoutAmount } = job.data;

  logger.info('Loan repayment worker processing', {
    jobId: job.id,
    userId,
    payoutId,
    payoutAmount,
  });

  try {
    // 1. Find active loan with auto-deduct enabled
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        status: 'active',
        autoDeductPercent: { not: null },
        repaymentMethod: 'auto_deduct',
      },
    });

    if (!activeLoan) {
      logger.debug('No active auto-deduct loan found', { userId });
      return { deducted: false, reason: 'no_active_loan' };
    }

    // 2. Calculate deduction amount
    const deductPercent = activeLoan.autoDeductPercent || 10;
    const deductAmount = Math.round((payoutAmount * deductPercent) / 100);

    if (deductAmount <= 0) {
      return { deducted: false, reason: 'deduction_too_small' };
    }

    // 3. Calculate remaining balance
    const remainingBalance = Number(activeLoan.totalRepayable) - Number(activeLoan.amountRepaid);
    const actualDeduction = Math.min(deductAmount, remainingBalance);

    if (actualDeduction <= 0) {
      return { deducted: false, reason: 'loan_already_repaid' };
    }

    // 4. Atomic: deduct from wallet + update loan
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: BigInt(actualDeduction) } },
      });

      // Update loan repaid amount
      const updatedLoan = await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          amountRepaid: { increment: BigInt(actualDeduction) },
        },
      });

      // Add to repayment history
      await tx.loanRepayment.create({
        data: {
          loanId: activeLoan.id,
          amount: BigInt(actualDeduction),
          payoutId,
        },
      });

      return updatedLoan;
    });

    // 5. Check if loan is fully repaid
    const totalRepaid = Number(result.amountRepaid);
    const totalRepayable = Number(result.totalRepayable);
    const isFullyRepaid = totalRepaid >= totalRepayable;

    if (isFullyRepaid) {
      // Mark loan as repaid
      await prisma.loan.update({
        where: { id: activeLoan.id },
        data: { status: 'repaid' },
      });

      // Send congratulations notification
      await notificationQueue.add({
        userId,
        notification: {
          type: 'loan_repaid',
          title: 'Loan Fully Repaid! 🎉',
          body: `Congratulations! Your loan of ₹${(Number(activeLoan.amount) / 100).toFixed(2)} has been fully repaid.`,
          data: { loanId: activeLoan.id, screen: 'loans' },
        },
        channels: ['in_app', 'push', 'whatsapp'],
      });

      logger.info('Loan fully repaid!', { loanId: activeLoan.id, userId });
    } else {
      // Send auto-deduct confirmation
      await notificationQueue.add({
        userId,
        notification: {
          type: 'loan_auto_deduct',
          title: 'Loan Auto-Deduction',
          body: `₹${(actualDeduction / 100).toFixed(2)} auto-deducted for loan repayment. Remaining: ₹${((totalRepayable - totalRepaid) / 100).toFixed(2)}`,
          data: { loanId: activeLoan.id, screen: 'loans' },
        },
        channels: ['in_app'],
      });
    }

    const resultData = {
      deducted: true,
      loanId: activeLoan.id,
      deductedAmount: actualDeduction,
      totalRepaid,
      totalRepayable,
      isFullyRepaid,
    };

    logger.info('Loan repayment worker completed', {
      jobId: job.id,
      ...resultData,
    });

    return resultData;
  } catch (error) {
    logger.error('Loan repayment worker failed', {
      jobId: job.id,
      userId,
      error: error.message,
    });
    throw error;
  }
});

loanRepaymentQueue.on('completed', (job, result) => {
  logger.debug(`Loan repayment job #${job.id} completed`, result);
});

module.exports = loanRepaymentQueue;
