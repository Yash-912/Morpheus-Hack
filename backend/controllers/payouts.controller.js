// ============================================================
// Payouts Controller — balance, fee preview, initiate, status, history
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const FraudService = require('../services/fraud.service');
const LoanService = require('../services/loan.service');
const SavingsService = require('../services/savings.service');
const NotificationService = require('../services/notification.service');
const {
  PAYOUT_FEE_PERCENT,
  INSTANT_PAYOUT_FEE_PERCENT,
  PAYOUT_FEE_FLAT,
  DAILY_CASHOUT_LIMIT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} = require('../config/constants');
const { paiseToRupees } = require('../utils/formatters.utils');

const payoutsController = {
  /**
   * GET /api/payouts/balance
   * Wallet balance + pending earnings.
   */
  async getBalance(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { walletBalance: true },
      });

      // Today's unsynced/pending earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pendingAgg = await prisma.earning.aggregate({
        where: {
          userId: req.user.id,
          date: { gte: today },
          verified: true, // We don't have settled in schema, but verified is there
        },
        _sum: { netAmount: true },
      });

      // Today's payouts for daily limit check
      const todayPayoutsAgg = await prisma.payout.aggregate({
        where: {
          userId: req.user.id,
          createdAt: { gte: today },
          status: { in: ['pending', 'processing', 'completed'] },
        },
        _sum: { amount: true },
      });

      res.json({
        success: true,
        data: {
          walletBalance: Number(user.walletBalance),
          pendingEarnings: Number(pendingAgg._sum.netAmount || 0),
          todayWithdrawn: Number(todayPayoutsAgg._sum.amount || 0),
          dailyLimit: DAILY_CASHOUT_LIMIT,
          dailyRemaining: Math.max(
            0,
            DAILY_CASHOUT_LIMIT - Number(todayPayoutsAgg._sum.amount || 0)
          ),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/payouts/fee-preview
   * Calculate fee for amount/type.
   */
  async feePreview(req, res, next) {
    try {
      const amount = parseInt(req.query.amount, 10);
      const type = req.query.type || 'standard';

      const feePercent = type === 'instant' ? INSTANT_PAYOUT_FEE_PERCENT : PAYOUT_FEE_PERCENT;
      const percentFee = Math.round(amount * feePercent);
      const totalFee = percentFee + PAYOUT_FEE_FLAT;
      const netAmount = amount - totalFee;

      res.json({
        success: true,
        data: {
          amount,
          type,
          feePercent: feePercent * 100,
          percentFee,
          flatFee: PAYOUT_FEE_FLAT,
          totalFee,
          netAmount,
          estimatedTime: type === 'instant' ? '30 seconds' : '1-2 hours',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/payouts/initiate
   * LAYER 2 — WORKER CASHOUT REQUEST (Stripe involved here)
   */
  async initiate(req, res, next) {
    try {
      const amountRaw = req.body.amount;

      // Strict Phase 2 Check: Prevent "Outrageous Decimal" Bug.
      // Must be an integer representing exact paise. No decimals allowed.
      if (typeof amountRaw === 'number' && !Number.isInteger(amountRaw)) {
        return res.status(400).json({
          success: false,
          error: { code: 'PAY_002', message: 'Amount payload must be strictly sent in integer paise (multiplied by 100), not decimals.' }
        });
      }

      const requestedAmount = parseInt(amountRaw, 10);
      const type = req.body.type || 'standard';
      const userId = req.user.id;

      // Step 1: Validate worker has sufficient wallet balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (Number(user.walletBalance) < requestedAmount) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PAY_001',
            message: `Insufficient balance. Available: ₹${paiseToRupees(Number(user.walletBalance))}`,
          },
        });
      }

      // Step 2: Calculate fee
      const fee = Math.max(500, Math.round(requestedAmount * 0.012));
      const netAmount = requestedAmount - fee;

      // Step 3: Check Stripe float via getFloatBalance()
      const StripeService = require('../services/stripe.service');
      const floatCheck = await StripeService.getFloatBalance();
      const floatSufficient = floatCheck.sufficient;

      // Step 4: Deduct active loan if exists
      let loanDeduction = 0;
      const activeLoan = await prisma.loan.findFirst({
        where: { userId, status: 'active' },
      });

      if (activeLoan) {
        loanDeduction = Math.round(netAmount * ((activeLoan.autoDeductPercent || 10) / 100));
        const remaining = Number(activeLoan.totalRepayable) - Number(activeLoan.amountRepaid);
        loanDeduction = Math.min(loanDeduction, remaining);

        const newRepaidAmount = Number(activeLoan.amountRepaid) + loanDeduction;
        await prisma.loan.update({
          where: { id: activeLoan.id },
          data: {
            amountRepaid: BigInt(Math.round(newRepaidAmount)),
            status: newRepaidAmount >= Number(activeLoan.totalRepayable) ? 'repaid' : 'active'
          }
        });
      }

      // Step 5: Calculate finalAmount
      const finalAmount = netAmount - loanDeduction;

      // Step 6: Create Stripe transfer (only if float sufficient)
      let transferId = null;
      if (floatSufficient) {
        const transferResult = await StripeService.createEarnedWageTransfer(finalAmount, {
          worker_id: userId,
          type: 'earned_wage_advance',
          platform: 'gigpay',
          loan_deduction: loanDeduction
        });
        transferId = transferResult.transferId;
      }

      // Step 7: Deduct worker wallet in DB
      await prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: BigInt(requestedAmount) } },
      });

      // Step 8: Create payout record
      const payout = await prisma.payout.create({
        data: {
          userId,
          amount: BigInt(requestedAmount),
          fee,
          netAmount: finalAmount,
          loanDeduction,
          stripeTransferId: transferId,
          type,
          status: 'pending',
        },
      });

      // Step 9: Simulate UPI transfer completion after 3 seconds
      if (floatSufficient) {
        setTimeout(async () => {
          try {
            await prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: "completed",
                completedAt: new Date()
              }
            });
            // call sendWhatsAppNotification
            await NotificationService.send(userId, {
              type: 'payout_success',
              title: 'Payout Successful',
              body: `₹${(finalAmount / 100).toFixed(2)} has been sent to your UPI.`,
              channel: ['whatsapp', 'push']
            });

            // emit socket event "payout:completed" to user's room
            const io = global.__io;
            if (io) {
              io.to(`user:${userId}`).emit('payout:completed', { payoutId: payout.id, finalAmount });
            }
          } catch (e) {
            logger.error('Fake UPI completion error', e);
          }
        }, 3000);
      }

      // Step 10: Return response immediately (don't wait for setTimeout)
      res.json({
        success: true,
        data: {
          payoutId: payout.id,
          amount: Number(payout.amount),
          fee: Number(payout.fee),
          netAmount: Number(payout.netAmount),
          loanDeduction,
          status: payout.status,
          estimatedTime: type === 'instant' ? '30 seconds' : '1-2 hours',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/payouts/status/:payoutId
   */
  async getStatus(req, res, next) {
    try {
      const payout = await prisma.payout.findFirst({
        where: { id: req.params.payoutId, userId: req.user.id },
      });

      if (!payout) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Payout not found' },
        });
      }

      res.json({
        success: true,
        data: {
          ...payout,
          amount: Number(payout.amount),
          fee: Number(payout.fee),
          netAmount: Number(payout.netAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/payouts/history
   */
  async getHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const skip = (page - 1) * limit;

      const where = { userId: req.user.id };
      if (req.query.status) where.status = req.query.status;

      const [payouts, total] = await Promise.all([
        prisma.payout.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.payout.count({ where }),
      ]);

      const data = payouts.map((p) => ({
        ...p,
        amount: Number(p.amount),
        fee: Number(p.fee),
        netAmount: Number(p.netAmount),
      }));

      res.json({
        success: true,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = payoutsController;
