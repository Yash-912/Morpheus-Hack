// ============================================================
// Zone Scheduler — hot zone refresh every 5 minutes
// ============================================================

const cron = require('node-cron');
const { zoneComputeQueue } = require('../queues');
const { SUPPORTED_CITIES } = require('../../config/constants');
const logger = require('../../utils/logger.utils');

/**
 * Runs every 5 minutes.
 * For each active city, enqueues a zoneComputeQueue job.
 */
function startZoneScheduler() {
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Zone scheduler triggered — 5-minute refresh');

    try {
      const cities = SUPPORTED_CITIES;

      for (const city of cities) {
        const jobId = `zone-${city}-${Math.floor(Date.now() / 300000)}`; // unique per 5-min window

        await zoneComputeQueue.add(
          { city },
          {
            jobId,     // deduplicate within same 5-min window
            priority: 3,
            timeout: 30000, // 30s max
          }
        );
      }

      logger.debug('Zone compute jobs enqueued', { cities: cities.length });
    } catch (error) {
      logger.error('Zone scheduler failed', { error: error.message });
    }
  });

  logger.info(`Zone scheduler registered — runs every 5 minutes for ${SUPPORTED_CITIES.length} cities`);
}

module.exports = { startZoneScheduler };
