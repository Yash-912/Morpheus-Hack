// ============================================================
// Savings Controller — goals, create, deposit, withdraw, toggle
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

const savingsController = {
  /**
   * GET /api/savings
   * All saving goals for the user.
   */
  async list(req, res, next) {
    try {
      const goals = await prisma.savingsGoal.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      const data = goals.map((g) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        progress: g.targetAmount > 0
          ? Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)
          : 0,
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/savings/create
   */
  async create(req, res, next) {
    try {
      const { name, targetAmount, autoSavePercent } = req.body;

      const goal = await prisma.savingsGoal.create({
        data: {
          userId: req.user.id,
          name,
          targetAmount: BigInt(targetAmount),
          currentAmount: BigInt(0),
          autoSavePercent: autoSavePercent || 0,
          autoSaveEnabled: !!autoSavePercent,
          status: 'active',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...goal,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/savings/:id/deposit
   * Manual deposit from wallet.
   */
  async deposit(req, res, next) {
    try {
      const { amount } = req.body;
      const goalId = req.params.id;

      const goal = await prisma.savingsGoal.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Savings goal not found' },
        });
      }

      // Check wallet balance
      const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
      if (!wallet || Number(wallet.balance) < amount) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_BALANCE', message: 'Not enough wallet balance' },
        });
      }

      // Atomic: deduct wallet + credit goal
      const updated = await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: req.user.id },
          data: { balance: { decrement: BigInt(amount) } },
        });

        return tx.savingsGoal.update({
          where: { id: goalId },
          data: { currentAmount: { increment: BigInt(amount) } },
        });
      });

      // Check if goal completed
      const isCompleted = Number(updated.currentAmount) >= Number(updated.targetAmount);
      if (isCompleted && updated.status !== 'completed') {
        await prisma.savingsGoal.update({
          where: { id: goalId },
          data: { status: 'completed' },
        });
      }

      logger.info('Savings deposit', { goalId, userId: req.user.id, amount });

      res.json({
        success: true,
        data: {
          ...updated,
          targetAmount: Number(updated.targetAmount),
          currentAmount: Number(updated.currentAmount),
          isCompleted,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/savings/:id/withdraw
   * Withdraw from goal back to wallet.
   */
  async withdraw(req, res, next) {
    try {
      const { amount } = req.body;
      const goalId = req.params.id;

      const goal = await prisma.savingsGoal.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Savings goal not found' },
        });
      }

      if (Number(goal.currentAmount) < amount) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_SAVINGS', message: 'Goal balance insufficient for withdrawal' },
        });
      }

      // Atomic: decrement goal + credit wallet
      const updated = await prisma.$transaction(async (tx) => {
        const g = await tx.savingsGoal.update({
          where: { id: goalId },
          data: { currentAmount: { decrement: BigInt(amount) } },
        });

        await tx.wallet.update({
          where: { userId: req.user.id },
          data: { balance: { increment: BigInt(amount) } },
        });

        return g;
      });

      logger.info('Savings withdrawal', { goalId, userId: req.user.id, amount });

      res.json({
        success: true,
        data: {
          ...updated,
          targetAmount: Number(updated.targetAmount),
          currentAmount: Number(updated.currentAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/savings/:id/toggle
   * Pause/resume auto-save.
   */
  async toggle(req, res, next) {
    try {
      const goalId = req.params.id;

      const goal = await prisma.savingsGoal.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Savings goal not found' },
        });
      }

      const updated = await prisma.savingsGoal.update({
        where: { id: goalId },
        data: { autoSaveEnabled: !goal.autoSaveEnabled },
      });

      res.json({
        success: true,
        data: {
          ...updated,
          targetAmount: Number(updated.targetAmount),
          currentAmount: Number(updated.currentAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = savingsController;
