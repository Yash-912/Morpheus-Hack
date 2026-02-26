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
   * Full payout flow: balance check → daily limit → fraud → loan deduct → savings → enqueue.
   */
  async initiate(req, res, next) {
    try {
      const { amount, type = 'standard' } = req.body;
      const userId = req.user.id;

      // 1. Check wallet balance
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (Number(user.walletBalance) < amount) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: `Insufficient balance. Available: ₹${paiseToRupees(Number(user.walletBalance))}`,
          },
        });
      }

      // 2. Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayPayouts = await prisma.payout.aggregate({
        where: {
          userId,
          createdAt: { gte: today },
          status: { in: ['pending', 'processing', 'completed'] },
        },
        _sum: { amount: true },
      });

      const todayTotal = Number(todayPayouts._sum.amount || 0);
      if (todayTotal + amount > DAILY_CASHOUT_LIMIT) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DAILY_LIMIT_EXCEEDED',
            message: `Daily withdrawal limit ₹${paiseToRupees(DAILY_CASHOUT_LIMIT)} exceeded. Remaining: ₹${paiseToRupees(DAILY_CASHOUT_LIMIT - todayTotal)}`,
          },
        });
      }

      // 3. Fraud check
      const fraudResult = await FraudService.checkPayoutFraud(userId, amount);
      if (fraudResult.blocked) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PAYOUT_BLOCKED',
            message: 'Payout blocked for security reasons',
            reasons: fraudResult.reasons,
          },
        });
      }

      // 4. Calculate fee
      const feePercent = type === 'instant' ? INSTANT_PAYOUT_FEE_PERCENT : PAYOUT_FEE_PERCENT;
      const fee = Math.round(amount * feePercent) + PAYOUT_FEE_FLAT;
      const netAmount = amount - fee;

      // 5. Loan auto-deduct
      let loanDeduction = 0;
      const activeLoan = await prisma.loan.findFirst({
        where: { userId, status: 'active' },
      });

      if (activeLoan) {
        loanDeduction = Math.round(netAmount * ((activeLoan.autoDeductPercent || 10) / 100));
        const remaining = Number(activeLoan.totalRepayable) - Number(activeLoan.amountRepaid);
        loanDeduction = Math.min(loanDeduction, remaining);
      }

      // 6. Create payout record + deduct wallet atomically
      const payout = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: BigInt(amount) } },
        });

        const p = await tx.payout.create({
          data: {
            userId,
            amount: BigInt(amount),
            fee: BigInt(fee),
            netAmount: BigInt(netAmount - loanDeduction),
            type,
            status: 'pending',
          },
        });

        return p;
      });

      // 7. Process loan repayment if applicable
      if (loanDeduction > 0 && activeLoan) {
        await LoanService.processRepayment(activeLoan.id, loanDeduction, payout.id);
      }

      // 8. Savings round-up
      await SavingsService.processRoundUp(userId, netAmount - loanDeduction).catch(() => { });

      // 9. Send confirmation notification
      await NotificationService.sendPayoutConfirmation(userId, {
        amount,
        fee,
        netAmount: netAmount - loanDeduction,
        loanDeduction,
        payoutId: payout.id,
      }).catch(() => { });

      logger.info('Payout initiated', {
        userId,
        payoutId: payout.id,
        amount: paiseToRupees(amount),
        fee: paiseToRupees(fee),
      });

      res.status(201).json({
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
