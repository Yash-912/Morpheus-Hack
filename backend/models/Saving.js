// ============================================================
// Saving Model Helper — Goals, deposits, withdrawals, round-ups
// ============================================================

const prisma = require('../config/database');

const SavingHelper = {
  // -----------------------------------------------------------
  // Get all savings goals for a user
  // -----------------------------------------------------------
  async getUserSavings(userId) {
    const savings = await prisma.saving.findMany({
      where: { userId },
      include: {
        transactions: { orderBy: { date: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return savings.map(SavingHelper.serialize);
  },

  // -----------------------------------------------------------
  // Create a new savings goal
  // -----------------------------------------------------------
  async createGoal(userId, data) {
    return prisma.saving.create({
      data: {
        userId,
        type: data.type,
        goalName: data.goalName,
        goalAmount: data.goalAmount ? BigInt(data.goalAmount) : null,
        partner: data.partner,
        autoSavePercent: data.autoSavePercent,
      },
    });
  },

  // -----------------------------------------------------------
  // Process a deposit into a savings goal
  // -----------------------------------------------------------
  async processDeposit(savingId, amount, source = 'manual') {
    return prisma.$transaction(async (tx) => {
      // Create transaction record
      await tx.savingTransaction.create({
        data: {
          savingId,
          type: 'deposit',
          amount: BigInt(amount),
          source,
        },
      });

      // Update current amount
      const saving = await tx.saving.update({
        where: { id: savingId },
        data: {
          currentAmount: { increment: BigInt(amount) },
        },
      });

      // Check if goal reached
      if (saving.goalAmount && saving.currentAmount >= saving.goalAmount) {
        await tx.saving.update({
          where: { id: savingId },
          data: { status: 'completed' },
        });
      }

      return saving;
    });
  },

  // -----------------------------------------------------------
  // Process a withdrawal from a savings goal
  // -----------------------------------------------------------
  async processWithdrawal(savingId, amount) {
    return prisma.$transaction(async (tx) => {
      const saving = await tx.saving.findUnique({ where: { id: savingId } });

      if (!saving || Number(saving.currentAmount) < amount) {
        throw new Error('INSUFFICIENT_SAVINGS');
      }

      await tx.savingTransaction.create({
        data: {
          savingId,
          type: 'withdrawal',
          amount: BigInt(amount),
          source: 'manual_withdrawal',
        },
      });

      return tx.saving.update({
        where: { id: savingId },
        data: {
          currentAmount: { decrement: BigInt(amount) },
        },
      });
    });
  },

  // -----------------------------------------------------------
  // Process round-up auto-savings after a payout
  // Rounds up the payout to nearest ₹10, saves the difference
  // -----------------------------------------------------------
  async processRoundUp(userId, payoutAmountPaise) {
    // Find active round-up savings for this user
    const roundUpSaving = await prisma.saving.findFirst({
      where: {
        userId,
        type: 'round_up',
        status: 'active',
      },
    });

    if (!roundUpSaving) return null;

    // Round up to nearest ₹10 (1000 paise)
    const remainder = payoutAmountPaise % 1000;
    if (remainder === 0) return null;

    const roundUpAmount = 1000 - remainder;

    return SavingHelper.processDeposit(roundUpSaving.id, roundUpAmount, 'round_up');
  },

  // -----------------------------------------------------------
  // Toggle auto-save (pause/resume)
  // -----------------------------------------------------------
  async toggleAutoSave(savingId) {
    const saving = await prisma.saving.findUnique({ where: { id: savingId } });
    if (!saving) throw new Error('SAVING_NOT_FOUND');

    const newStatus = saving.status === 'active' ? 'paused' : 'active';
    return prisma.saving.update({
      where: { id: savingId },
      data: { status: newStatus },
    });
  },

  // -----------------------------------------------------------
  // Serialize for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(saving) {
    if (!saving) return null;
    return {
      ...saving,
      goalAmount: saving.goalAmount ? Number(saving.goalAmount) : null,
      currentAmount: Number(saving.currentAmount),
      interestEarned: Number(saving.interestEarned),
      transactions: saving.transactions?.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    };
  },
};

module.exports = SavingHelper;
