// ============================================================
// Loan Model Helper — Eligibility, repayment, outstanding balance
// ============================================================

const prisma = require('../config/database');

const LoanHelper = {
  // -----------------------------------------------------------
  // Computed: Outstanding balance for a loan
  // -----------------------------------------------------------
  outstandingBalance(loan) {
    return Number(loan.totalRepayable) - Number(loan.amountRepaid);
  },

  // -----------------------------------------------------------
  // Get active loans for a user
  // -----------------------------------------------------------
  async getActiveLoans(userId) {
    return prisma.loan.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: { repaymentHistory: { orderBy: { date: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  // -----------------------------------------------------------
  // Get total outstanding amount across all active loans
  // -----------------------------------------------------------
  async getTotalOutstanding(userId) {
    const activeLoans = await prisma.loan.findMany({
      where: { userId, status: 'active' },
      select: { totalRepayable: true, amountRepaid: true },
    });

    let total = BigInt(0);
    for (const loan of activeLoans) {
      total += loan.totalRepayable - loan.amountRepaid;
    }

    return Number(total);
  },

  // -----------------------------------------------------------
  // Check if user has any defaulted loans
  // -----------------------------------------------------------
  async hasDefaultedLoans(userId) {
    const count = await prisma.loan.count({
      where: { userId, status: 'defaulted' },
    });
    return count > 0;
  },

  // -----------------------------------------------------------
  // Check if user has an active loan with less than 50% repaid
  // -----------------------------------------------------------
  async hasUnderRepaidActiveLoan(userId) {
    const activeLoans = await prisma.loan.findMany({
      where: { userId, status: 'active' },
      select: { totalRepayable: true, amountRepaid: true },
    });

    return activeLoans.some(
      (loan) => Number(loan.amountRepaid) < Number(loan.totalRepayable) * 0.5
    );
  },

  // -----------------------------------------------------------
  // Record a repayment
  // -----------------------------------------------------------
  async processRepayment(loanId, amount, payoutId = null) {
    return prisma.$transaction(async (tx) => {
      // Create repayment record
      await tx.loanRepayment.create({
        data: {
          loanId,
          amount: BigInt(amount),
          payoutId,
        },
      });

      // Update loan amount_repaid
      const loan = await tx.loan.update({
        where: { id: loanId },
        data: {
          amountRepaid: { increment: BigInt(amount) },
        },
      });

      // Check if fully repaid
      if (loan.amountRepaid >= loan.totalRepayable) {
        await tx.loan.update({
          where: { id: loanId },
          data: { status: 'repaid' },
        });
      }

      return loan;
    });
  },

  // -----------------------------------------------------------
  // Get loan history for a user (paginated)
  // -----------------------------------------------------------
  async getHistory(userId, { page = 1, limit = 20 } = {}) {
    const where = { userId };

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { repaymentHistory: { orderBy: { date: 'desc' } } },
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      data: loans.map(LoanHelper.serialize),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // -----------------------------------------------------------
  // Get on-time repayment percentage (for GigScore)
  // -----------------------------------------------------------
  async getRepaymentScore(userId) {
    const completedLoans = await prisma.loan.findMany({
      where: { userId, status: { in: ['repaid', 'defaulted'] } },
      select: { status: true },
    });

    if (completedLoans.length === 0) return null; // no loan history

    const onTime = completedLoans.filter((l) => l.status === 'repaid').length;
    return onTime / completedLoans.length;
  },

  // -----------------------------------------------------------
  // Serialize loan for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(loan) {
    if (!loan) return null;
    return {
      ...loan,
      amount: Number(loan.amount),
      totalRepayable: Number(loan.totalRepayable),
      amountRepaid: Number(loan.amountRepaid),
      outstandingBalance: Number(loan.totalRepayable) - Number(loan.amountRepaid),
      repaymentHistory: loan.repaymentHistory?.map((r) => ({
        ...r,
        amount: Number(r.amount),
      })),
    };
  },
};

module.exports = LoanHelper;
