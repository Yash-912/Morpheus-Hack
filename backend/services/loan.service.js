// ============================================================
// Loan Service — NBFC micro-loan operations
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger.utils');
const { prisma } = require('../config/database');
const {
  MAX_LOAN_AMOUNT,
  LOAN_INTEREST_RATE_MONTHLY,
  GIGSCORE_MIN_FOR_LOAN,
} = require('../config/constants');
const { paiseToRupees } = require('../utils/formatters.utils');
const { calculateGigScore } = require('../utils/gigScore.utils');

const NBFC_API_URL = process.env.NBFC_API_URL || 'https://api.nbfc-partner.in/v1';
const NBFC_API_KEY = process.env.NBFC_API_KEY;

const nbfcClient = NBFC_API_KEY
  ? axios.create({
      baseURL: NBFC_API_URL,
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${NBFC_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
  : null;

const LoanService = {
  /**
   * Check loan eligibility for a user.
   * Criteria: GigScore >= 400, no defaults, no active loan > 50% repaid,
   * max = min(₹5,000, 5 × avg daily earnings over 30 days)
   * @param {string} userId
   * @returns {Promise<{ eligible: boolean, maxAmount: number, gigScore: number, reason?: string }>}
   */
  async checkEligibility(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Calculate fresh GigScore
    const gigScore = await calculateGigScore(userId);

    if (gigScore < GIGSCORE_MIN_FOR_LOAN) {
      return {
        eligible: false,
        maxAmount: 0,
        gigScore,
        reason: `GigScore ${gigScore} is below minimum ${GIGSCORE_MIN_FOR_LOAN}`,
      };
    }

    // Check for defaulted loans
    const defaultedLoan = await prisma.loan.findFirst({
      where: { userId, status: 'defaulted' },
    });

    if (defaultedLoan) {
      return {
        eligible: false,
        maxAmount: 0,
        gigScore,
        reason: 'Cannot apply with a defaulted loan on record',
      };
    }

    // Check active loan repayment progress
    const activeLoan = await prisma.loan.findFirst({
      where: { userId, status: 'active' },
    });

    if (activeLoan) {
      const repaidPercent = Number(activeLoan.repaidAmount) / Number(activeLoan.totalRepayable);
      if (repaidPercent < 0.5) {
        return {
          eligible: false,
          maxAmount: 0,
          gigScore,
          reason: 'Current loan must be at least 50% repaid before applying for a new one',
        };
      }
    }

    // Calculate max amount: min(₹5,000, 5 × avg daily earnings over 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const earningsAgg = await prisma.earning.aggregate({
      where: {
        userId,
        date: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const totalEarnings30d = Number(earningsAgg._sum.totalAmount || 0);
    const daysWithEarnings = earningsAgg._count || 1;
    const avgDailyPaise = Math.round(totalEarnings30d / Math.max(daysWithEarnings, 1));
    const fiveTimesAvg = avgDailyPaise * 5;
    const maxAmount = Math.min(MAX_LOAN_AMOUNT, fiveTimesAvg);

    if (maxAmount < 50000) {
      // ₹500 minimum loan
      return {
        eligible: false,
        maxAmount: 0,
        gigScore,
        reason: 'Insufficient earnings history for loan eligibility',
      };
    }

    return {
      eligible: true,
      maxAmount,
      gigScore,
      interestRate: LOAN_INTEREST_RATE_MONTHLY,
      avgDailyEarnings: avgDailyPaise,
    };
  },

  /**
   * Apply for a loan and request NBFC disbursement.
   * @param {string} userId
   * @param {number} amount — in paise
   * @param {number} repaymentPercent — auto-deduct % from each payout (5-20%)
   * @returns {Promise<Object>} loan record
   */
  async applyLoan(userId, amount, repaymentPercent) {
    // Verify eligibility
    const eligibility = await LoanService.checkEligibility(userId);
    if (!eligibility.eligible) {
      const error = new Error(eligibility.reason || 'Not eligible for a loan');
      error.statusCode = 400;
      throw error;
    }

    if (amount > eligibility.maxAmount) {
      const error = new Error(
        `Requested amount ₹${paiseToRupees(amount)} exceeds maximum ₹${paiseToRupees(eligibility.maxAmount)}`
      );
      error.statusCode = 400;
      throw error;
    }

    if (repaymentPercent < 5 || repaymentPercent > 20) {
      const error = new Error('Repayment percentage must be between 5% and 20%');
      error.statusCode = 400;
      throw error;
    }

    const totalRepayable = Math.round(amount * (1 + LOAN_INTEREST_RATE_MONTHLY));

    // ---- NBFC disbursement ----
    let nbfcLoanId = null;
    if (nbfcClient) {
      try {
        const response = await nbfcClient.post('/loans/disburse', {
          borrower_id: userId,
          amount_paise: amount,
          interest_rate: LOAN_INTEREST_RATE_MONTHLY,
          tenure_days: 30,
        });
        nbfcLoanId = response.data.loan_id;
      } catch (error) {
        logger.error('NBFC disbursement failed:', error.message);
        const err = new Error('Loan disbursement failed. Please try again later.');
        err.statusCode = 503;
        throw err;
      }
    } else {
      nbfcLoanId = `local_${Date.now()}`;
      logger.warn('NBFC API not configured — using local loan ID');
    }

    // Create loan record
    const loan = await prisma.loan.create({
      data: {
        userId,
        amount: BigInt(amount),
        totalRepayable: BigInt(totalRepayable),
        repaidAmount: BigInt(0),
        interestRate: LOAN_INTEREST_RATE_MONTHLY,
        repaymentPercent,
        status: 'active',
        disbursedAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nbfcLoanId,
      },
    });

    logger.info('Loan disbursed', {
      userId,
      loanId: loan.id,
      amount: paiseToRupees(amount),
    });

    return loan;
  },

  /**
   * Process a loan repayment (manual or auto-deducted from payout).
   * @param {string} loanId
   * @param {number} amount — in paise
   * @param {string} [payoutId] — linked payout if auto-deducted
   * @returns {Promise<{ remaining: number, status: string }>}
   */
  async processRepayment(loanId, amount, payoutId = null) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || loan.status !== 'active') {
      const error = new Error('Active loan not found');
      error.statusCode = 404;
      throw error;
    }

    const newRepaid = Number(loan.repaidAmount) + amount;
    const totalRepayable = Number(loan.totalRepayable);
    const isFullyRepaid = newRepaid >= totalRepayable;

    await prisma.loan.update({
      where: { id: loanId },
      data: {
        repaidAmount: BigInt(Math.min(newRepaid, totalRepayable)),
        status: isFullyRepaid ? 'repaid' : 'active',
        ...(isFullyRepaid ? { closedAt: new Date() } : {}),
      },
    });

    logger.info('Loan repayment processed', {
      loanId,
      amount: paiseToRupees(amount),
      remaining: paiseToRupees(Math.max(0, totalRepayable - newRepaid)),
      fullyRepaid: isFullyRepaid,
      payoutId,
    });

    return {
      remaining: Math.max(0, totalRepayable - newRepaid),
      status: isFullyRepaid ? 'repaid' : 'active',
    };
  },

  /**
   * Check if a loan has defaulted (past due date, not fully repaid).
   * @param {string} loanId
   * @returns {Promise<boolean>}
   */
  async checkDefault(loanId) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan || loan.status !== 'active') return false;

    const now = new Date();
    if (now > loan.dueDate && Number(loan.repaidAmount) < Number(loan.totalRepayable)) {
      await prisma.loan.update({
        where: { id: loanId },
        data: { status: 'defaulted' },
      });

      logger.warn('Loan defaulted', {
        loanId,
        userId: loan.userId,
        outstanding: paiseToRupees(Number(loan.totalRepayable) - Number(loan.repaidAmount)),
      });

      return true;
    }

    return false;
  },
};

module.exports = LoanService;
