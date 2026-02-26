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
      const goals = await prisma.saving.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      const data = goals.map((g) => ({
        ...g,
        targetAmount: Number(g.goalAmount || 0),
        currentAmount: Number(g.currentAmount),
        progress: g.goalAmount > 0
          ? Math.round((Number(g.currentAmount) / Number(g.goalAmount)) * 100)
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

      const goal = await prisma.saving.create({
        data: {
          userId: req.user.id,
          goalName: name,
          type: 'goal_based',
          goalAmount: BigInt(targetAmount),
          currentAmount: BigInt(0),
          autoSavePercent: autoSavePercent || 0,
          status: 'active',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...goal,
          targetAmount: Number(goal.goalAmount),
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

      const goal = await prisma.saving.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Savings goal not found' },
        });
      }

      // Check wallet balance
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { walletBalance: true },
      });
      if (!user || Number(user.walletBalance) < amount) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_BALANCE', message: 'Not enough wallet balance' },
        });
      }

      // Atomic: deduct wallet + credit goal
      const updated = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: req.user.id },
          data: { walletBalance: { decrement: BigInt(amount) } },
        });

        return tx.saving.update({
          where: { id: goalId },
          data: { currentAmount: { increment: BigInt(amount) } },
        });
      });

      // Check if goal completed
      const isCompleted = updated.goalAmount && Number(updated.currentAmount) >= Number(updated.goalAmount);
      if (isCompleted && updated.status !== 'completed') {
        await prisma.saving.update({
          where: { id: goalId },
          data: { status: 'completed' },
        });
      }

      logger.info('Savings deposit', { goalId, userId: req.user.id, amount });

      res.json({
        success: true,
        data: {
          ...updated,
          targetAmount: Number(updated.goalAmount || 0),
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

      const goal = await prisma.saving.findFirst({
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
        const g = await tx.saving.update({
          where: { id: goalId },
          data: { currentAmount: { decrement: BigInt(amount) } },
        });

        await tx.user.update({
          where: { id: req.user.id },
          data: { walletBalance: { increment: BigInt(amount) } },
        });

        return g;
      });

      logger.info('Savings withdrawal', { goalId, userId: req.user.id, amount });

      res.json({
        success: true,
        data: {
          ...updated,
          targetAmount: Number(updated.goalAmount || 0),
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

      const goal = await prisma.saving.findFirst({
        where: { id: goalId, userId: req.user.id },
      });

      if (!goal) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Savings goal not found' },
        });
      }

      const newStatus = goal.status === 'active' ? 'paused' : 'active';
      const updated = await prisma.saving.update({
        where: { id: goalId },
        data: { status: newStatus },
      });

      res.json({
        success: true,
        data: {
          ...updated,
          targetAmount: Number(updated.goalAmount || 0),
          currentAmount: Number(updated.currentAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = savingsController;
