// ============================================================
// SMS Worker — batch SMS expense classification via ML service
// ============================================================

const { smsProcessingQueue, notificationQueue } = require('../queues');
const { prisma } = require('../../config/database');
const MLService = require('../../services/ml.service');
const { EXPENSE_CATEGORIES } = require('../../config/constants');
const logger = require('../../utils/logger.utils');

/**
 * Process SMS batches for expense detection.
 * Job data: { userId, messages: [{ body, timestamp }] }
 *
 * Calls ML service /sms/classify → creates Expense records for confirmed matches →
 * notifies user of auto-detected expenses.
 */
smsProcessingQueue.process(3, async (job) => {
  const { userId, messages } = job.data;

  logger.info('SMS worker processing', {
    jobId: job.id,
    userId,
    messageCount: messages.length,
  });

  try {
    // 1. Send messages to ML service for classification
    const classified = await MLService.classifySmsMessages(messages);

    if (!classified || !Array.isArray(classified) || classified.length === 0) {
      logger.info('SMS worker: no expenses detected', { userId, messageCount: messages.length });
      return { processed: messages.length, created: 0, skipped: messages.length };
    }

    // 2. Filter confident expense detections
    const expenseItems = classified.filter(
      (c) => c.category && c.category !== 'not_expense' && c.amount > 0 && (c.confidence || 0) >= 0.7
    );

    // 3. Create Expense records
    const created = [];
    for (const item of expenseItems) {
      try {
        // Check for duplicate (same amount, same merchant, same date)
        const existingExpense = await prisma.expense.findFirst({
          where: {
            userId,
            amount: BigInt(item.amount),
            merchant: item.merchant || undefined,
            date: item.date ? new Date(item.date) : undefined,
            source: 'sms',
          },
        });

        if (existingExpense) {
          logger.debug('SMS worker: duplicate expense skipped', { item });
          continue;
        }

        const catMeta = EXPENSE_CATEGORIES[item.category];

        const expense = await prisma.expense.create({
          data: {
            userId,
            category: item.category,
            amount: BigInt(item.amount),
            description: item.merchant
              ? `Payment to ${item.merchant}`
              : 'Auto-detected from SMS',
            merchant: item.merchant || null,
            date: item.date ? new Date(item.date) : new Date(),
            source: 'sms',
            taxDeductible: catMeta?.taxDeductible || item.is_tax_deductible || false,
          },
        });

        created.push({
          id: expense.id,
          category: expense.category,
          amount: Number(expense.amount),
          merchant: expense.merchant,
        });
      } catch (err) {
        logger.error('SMS worker: failed to create expense', {
          item,
          error: err.message,
        });
      }
    }

    // 4. Notify user of auto-detected expenses
    if (created.length > 0) {
      const totalAmount = created.reduce((sum, e) => sum + e.amount, 0);

      await notificationQueue.add({
        userId,
        notification: {
          type: 'expense_detected',
          title: `${created.length} Expense${created.length > 1 ? 's' : ''} Auto-Detected`,
          body: `We found ₹${(totalAmount / 100).toFixed(2)} in expenses from your SMS messages. Tap to review.`,
          data: { screen: 'expenses', count: created.length },
        },
        channels: ['in_app', 'push'],
      });
    }

    const result = {
      processed: messages.length,
      classified: classified.length,
      created: created.length,
      skipped: messages.length - created.length,
    };

    logger.info('SMS worker completed', { jobId: job.id, userId, ...result });
    return result;
  } catch (error) {
    logger.error('SMS worker failed', {
      jobId: job.id,
      userId,
      error: error.message,
    });
    throw error;
  }
});

smsProcessingQueue.on('completed', (job, result) => {
  logger.debug(`SMS job #${job.id} completed`, result);
});

module.exports = smsProcessingQueue;
