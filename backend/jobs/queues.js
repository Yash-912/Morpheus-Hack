// ============================================================
// Bull Queue Definitions — all async job queues
// ============================================================

const Bull = require('bull');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger.utils');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Shared Bull options — reuse existing Redis connections where possible
const defaultOpts = {
  redis: REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 100,   // keep last 100 completed for inspection
    removeOnFail: 200,       // keep last 200 failed for debugging
  },
};

// ---- Queue Instances ----

/**
 * Payout disbursement queue.
 * Job data: { payoutId, userId, amount, upiId, fundAccountId }
 */
const payoutQueue = new Bull('payout-disbursement', {
  ...defaultOpts,
  defaultJobOptions: {
    ...defaultOpts.defaultJobOptions,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

/**
 * Platform settlement reconciliation queue.
 * Job data: { payoutId } (or batch)
 */
const settlementQueue = new Bull('settlement-reconciliation', {
  ...defaultOpts,
  defaultJobOptions: {
    ...defaultOpts.defaultJobOptions,
    attempts: 2,
    backoff: { type: 'fixed', delay: 30000 },
  },
});

/**
 * Multi-channel notification dispatch queue.
 * Job data: { userId, notification: { type, title, body, data }, channels }
 */
const notificationQueue = new Bull('notification-dispatch', {
  ...defaultOpts,
  defaultJobOptions: {
    ...defaultOpts.defaultJobOptions,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

/**
 * SMS expense extraction queue.
 * Job data: { userId, messages: [{ body, timestamp }] }
 */
const smsProcessingQueue = new Bull('sms-expense-processing', {
  ...defaultOpts,
  defaultJobOptions: {
    ...defaultOpts.defaultJobOptions,
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
  },
});

/**
 * Hot zone ML computation queue.
 * Job data: { city }
 */
const zoneComputeQueue = new Bull('zone-compute', {
  ...defaultOpts,
  defaultJobOptions: {
    ...defaultOpts.defaultJobOptions,
    attempts: 1,    // stale zones are fine, no retries
    timeout: 30000, // 30s max per city
  },
});

/**
 * Loan auto-repayment queue.
 * Job data: { userId, payoutId, payoutAmount }
 */
const loanRepaymentQueue = new Bull('loan-auto-repayment', {
  ...defaultOpts,
  defaultJobOptions: {
    ...defaultOpts.defaultJobOptions,
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
  },
});

// ---- Global event listeners (shared across all queues) ----
const queues = [
  payoutQueue,
  settlementQueue,
  notificationQueue,
  smsProcessingQueue,
  zoneComputeQueue,
  loanRepaymentQueue,
];

queues.forEach((q) => {
  q.on('error', (err) => {
    logger.error(`Queue [${q.name}] error:`, err.message);
  });

  q.on('failed', (job, err) => {
    logger.warn(`Queue [${q.name}] job #${job.id} failed (attempt ${job.attemptsMade}):`, err.message);
  });

  q.on('stalled', (jobId) => {
    logger.warn(`Queue [${q.name}] job #${jobId} stalled`);
  });
});

/**
 * Gracefully close all queues.
 */
async function closeAllQueues() {
  await Promise.all(queues.map((q) => q.close()));
  logger.info('All Bull queues closed');
}

module.exports = {
  payoutQueue,
  settlementQueue,
  notificationQueue,
  smsProcessingQueue,
  zoneComputeQueue,
  loanRepaymentQueue,
  closeAllQueues,
};
