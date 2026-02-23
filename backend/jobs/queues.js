// ============================================================
// Bull Queue Definitions — all async job queues
// Falls back to no-op stubs when Redis is unavailable (dev)
// ============================================================

const logger = require('../utils/logger.utils');

const REDIS_URL = process.env.REDIS_URL || '';
const USE_REDIS = REDIS_URL && !REDIS_URL.includes('mock') && REDIS_URL.startsWith('redis');

// ---- No-op queue stub for dev without Redis ----
class StubQueue {
  constructor(name) { this.name = name; }
  async add(data, opts) { logger.debug(`[StubQueue:${this.name}] job enqueued (no-op)`); return { id: 'stub-' + Date.now() }; }
  process() {}
  on() { return this; }
  async close() {}
}

let payoutQueue, settlementQueue, notificationQueue, smsProcessingQueue, zoneComputeQueue, loanRepaymentQueue;

if (USE_REDIS) {
  const Bull = require('bull');

  const defaultOpts = {
    redis: REDIS_URL,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  };

  payoutQueue = new Bull('payout-disbursement', {
    ...defaultOpts,
    defaultJobOptions: { ...defaultOpts.defaultJobOptions, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
  });

  settlementQueue = new Bull('settlement-reconciliation', {
    ...defaultOpts,
    defaultJobOptions: { ...defaultOpts.defaultJobOptions, attempts: 2, backoff: { type: 'fixed', delay: 30000 } },
  });

  notificationQueue = new Bull('notification-dispatch', {
    ...defaultOpts,
    defaultJobOptions: { ...defaultOpts.defaultJobOptions, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
  });

  smsProcessingQueue = new Bull('sms-expense-processing', {
    ...defaultOpts,
    defaultJobOptions: { ...defaultOpts.defaultJobOptions, attempts: 2, backoff: { type: 'fixed', delay: 10000 } },
  });

  zoneComputeQueue = new Bull('zone-compute', {
    ...defaultOpts,
    defaultJobOptions: { ...defaultOpts.defaultJobOptions, attempts: 1, timeout: 30000 },
  });

  loanRepaymentQueue = new Bull('loan-auto-repayment', {
    ...defaultOpts,
    defaultJobOptions: { ...defaultOpts.defaultJobOptions, attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
  });

  // Global event listeners
  const queues = [payoutQueue, settlementQueue, notificationQueue, smsProcessingQueue, zoneComputeQueue, loanRepaymentQueue];
  queues.forEach((q) => {
    q.on('error', (err) => logger.error(`Queue [${q.name}] error:`, err.message));
    q.on('failed', (job, err) => logger.warn(`Queue [${q.name}] job #${job.id} failed (attempt ${job.attemptsMade}):`, err.message));
    q.on('stalled', (jobId) => logger.warn(`Queue [${q.name}] job #${jobId} stalled`));
  });
} else {
  payoutQueue = new StubQueue('payout-disbursement');
  settlementQueue = new StubQueue('settlement-reconciliation');
  notificationQueue = new StubQueue('notification-dispatch');
  smsProcessingQueue = new StubQueue('sms-expense-processing');
  zoneComputeQueue = new StubQueue('zone-compute');
  loanRepaymentQueue = new StubQueue('loan-auto-repayment');
  logger.info('Bull queues using no-op stubs (set REDIS_URL for real queues)');
}

/**
 * Gracefully close all queues.
 */
async function closeAllQueues() {
  const allQueues = [payoutQueue, settlementQueue, notificationQueue, smsProcessingQueue, zoneComputeQueue, loanRepaymentQueue];
  await Promise.all(allQueues.map((q) => q.close()));
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
