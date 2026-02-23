// ============================================================
// Loans Controller — eligibility, apply, active, history, repay
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const LoanService = require('../services/loan.service');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');
const { paiseToRupees } = require('../utils/formatters.utils');

const loansController = {
  /**
   * GET /api/loans/eligibility
   */
  async checkEligibility(req, res, next) {
    try {
      const result = await LoanService.checkEligibility(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/loans/apply
   */
  async applyLoan(req, res, next) {
    try {
      const { amount, repaymentPercent } = req.body;
      const loan = await LoanService.applyLoan(req.user.id, amount, repaymentPercent);

      res.status(201).json({
        success: true,
        data: {
          id: loan.id,
          amount: Number(loan.amount),
          totalRepayable: Number(loan.totalRepayable),
          interestRate: loan.interestRate,
          repaymentPercent: loan.repaymentPercent,
          dueDate: loan.dueDate,
          status: loan.status,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/loans/active
   */
  async getActive(req, res, next) {
    try {
      const loans = await prisma.loan.findMany({
        where: { userId: req.user.id, status: 'active' },
        orderBy: { createdAt: 'desc' },
      });

      const data = loans.map((l) => ({
        ...l,
        amount: Number(l.amount),
        totalRepayable: Number(l.totalRepayable),
        repaidAmount: Number(l.repaidAmount),
        remaining: Number(l.totalRepayable) - Number(l.repaidAmount),
        progressPercent: Math.round(
          (Number(l.repaidAmount) / Number(l.totalRepayable)) * 100
        ),
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/loans/history
   */
  async getHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const skip = (page - 1) * limit;

      const [loans, total] = await Promise.all([
        prisma.loan.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.loan.count({ where: { userId: req.user.id } }),
      ]);

      const data = loans.map((l) => ({
        ...l,
        amount: Number(l.amount),
        totalRepayable: Number(l.totalRepayable),
        repaidAmount: Number(l.repaidAmount),
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

  /**
   * POST /api/loans/:loanId/repay
   */
  async repay(req, res, next) {
    try {
      const { loanId } = req.params;
      const { amount } = req.body;

      // Verify loan belongs to user
      const loan = await prisma.loan.findFirst({
        where: { id: loanId, userId: req.user.id },
      });

      if (!loan) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Loan not found' },
        });
      }

      // Check wallet balance
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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

      // Deduct from wallet
      await prisma.user.update({
        where: { id: req.user.id },
        data: { walletBalance: { decrement: BigInt(amount) } },
      });

      const result = await LoanService.processRepayment(loanId, amount);

      res.json({
        success: true,
        data: {
          remaining: result.remaining,
          status: result.status,
          message:
            result.status === 'repaid'
              ? 'Loan fully repaid! Congratulations!'
              : `Repayment of ₹${paiseToRupees(amount)} processed`,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = loansController;
