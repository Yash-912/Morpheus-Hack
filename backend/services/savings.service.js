// ============================================================
// Savings Service — Groww / Zerodha Coin integration
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger.utils');
const { prisma } = require('../config/database');
const { paiseToRupees } = require('../utils/formatters.utils');

const SAVINGS_API_URL = process.env.SAVINGS_API_URL || 'https://api.groww.in/v1';
const SAVINGS_API_KEY = process.env.SAVINGS_API_KEY;

const savingsClient = SAVINGS_API_KEY
  ? axios.create({
      baseURL: SAVINGS_API_URL,
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${SAVINGS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
  : null;

const SavingsService = {
  /**
   * Create a savings goal with fund allocation.
   * @param {string} userId
   * @param {{ name: string, targetAmount: number, autoSavePercent: number }} data
   *   targetAmount in paise, autoSavePercent 1-30
   * @returns {Promise<Object>} created Saving record
   */
  async createGoal(userId, data) {
    if (data.autoSavePercent < 1 || data.autoSavePercent > 30) {
      const error = new Error('Auto-save percent must be between 1% and 30%');
      error.statusCode = 400;
      throw error;
    }

    // Allocate fund if API is configured
    let externalFundId = null;
    if (savingsClient) {
      try {
        const response = await savingsClient.post('/funds/allocate', {
          user_id: userId,
          goal_name: data.name,
          fund_type: 'liquid', // Low-risk liquid mutual fund
          target_amount: data.targetAmount,
        });
        externalFundId = response.data.fund_allocation_id;
      } catch (error) {
        logger.warn('Savings fund allocation failed — proceeding without external fund:', error.message);
      }
    }

    const saving = await prisma.saving.create({
      data: {
        userId,
        goalName: data.name,
        targetAmount: BigInt(data.targetAmount),
        currentAmount: BigInt(0),
        autoSavePercent: data.autoSavePercent,
        isActive: true,
        externalFundId,
      },
    });

    logger.info('Savings goal created', {
      userId,
      savingId: saving.id,
      target: paiseToRupees(data.targetAmount),
    });

    return saving;
  },

  /**
   * Process a deposit into a savings goal.
   * @param {string} savingId
   * @param {number} amount — in paise
   * @returns {Promise<{ newBalance: number, progress: number }>}
   */
  async processDeposit(savingId, amount) {
    const saving = await prisma.saving.findUnique({ where: { id: savingId } });
    if (!saving) {
      const error = new Error('Savings goal not found');
      error.statusCode = 404;
      throw error;
    }

    if (!saving.isActive) {
      const error = new Error('Savings goal is paused');
      error.statusCode = 400;
      throw error;
    }

    // Deposit to external fund
    if (savingsClient && saving.externalFundId) {
      try {
        await savingsClient.post(`/funds/${saving.externalFundId}/deposit`, {
          amount_paise: amount,
        });
      } catch (error) {
        logger.error('External fund deposit failed:', error.message);
        // Continue — update local record even if external fails
      }
    }

    const newBalance = Number(saving.currentAmount) + amount;

    await prisma.saving.update({
      where: { id: savingId },
      data: { currentAmount: BigInt(newBalance) },
    });

    const target = Number(saving.targetAmount);
    const progress = target > 0 ? Math.min(100, Math.round((newBalance / target) * 100)) : 0;

    logger.info('Savings deposit processed', {
      savingId,
      amount: paiseToRupees(amount),
      newBalance: paiseToRupees(newBalance),
      progress: `${progress}%`,
    });

    return { newBalance, progress };
  },

  /**
   * Process a withdrawal from a savings goal.
   * @param {string} savingId
   * @param {number} amount — in paise
   * @returns {Promise<{ newBalance: number }>}
   */
  async processWithdrawal(savingId, amount) {
    const saving = await prisma.saving.findUnique({ where: { id: savingId } });
    if (!saving) {
      const error = new Error('Savings goal not found');
      error.statusCode = 404;
      throw error;
    }

    const currentBalance = Number(saving.currentAmount);
    if (amount > currentBalance) {
      const error = new Error(
        `Insufficient balance. Available: ₹${paiseToRupees(currentBalance)}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Redeem from external fund
    if (savingsClient && saving.externalFundId) {
      try {
        await savingsClient.post(`/funds/${saving.externalFundId}/redeem`, {
          amount_paise: amount,
        });
      } catch (error) {
        logger.error('External fund redemption failed:', error.message);
        const err = new Error('Withdrawal processing failed');
        err.statusCode = 503;
        throw err;
      }
    }

    const newBalance = currentBalance - amount;

    await prisma.saving.update({
      where: { id: savingId },
      data: { currentAmount: BigInt(newBalance) },
    });

    logger.info('Savings withdrawal processed', {
      savingId,
      amount: paiseToRupees(amount),
      newBalance: paiseToRupees(newBalance),
    });

    return { newBalance };
  },

  /**
   * Process round-up auto-deposit from a payout.
   * Rounds up to nearest ₹10 (1000 paise) and deposits the difference.
   * @param {string} userId
   * @param {number} payoutAmount — in paise
   * @returns {Promise<{ roundUpAmount: number, savingId: string }|null>}
   */
  async processRoundUp(userId, payoutAmount) {
    // Find active savings goal with auto-save enabled
    const saving = await prisma.saving.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' }, // Oldest goal first
    });

    if (!saving) return null;

    // Round up to nearest ₹10 (1000 paise)
    const roundUpUnit = 1000; // ₹10 in paise
    const remainder = payoutAmount % roundUpUnit;
    if (remainder === 0) return null; // Already a round number

    const roundUpAmount = roundUpUnit - remainder;

    if (roundUpAmount < 100) return null; // Skip if less than ₹1

    await SavingsService.processDeposit(saving.id, roundUpAmount);

    logger.debug('Round-up auto-save', {
      userId,
      roundUp: paiseToRupees(roundUpAmount),
      savingId: saving.id,
    });

    return { roundUpAmount, savingId: saving.id };
  },
};

module.exports = SavingsService;
