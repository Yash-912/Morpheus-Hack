// ============================================================
// Zone Worker — hot zone computation via ML service
// ============================================================

const { zoneComputeQueue } = require('../queues');
const { redisClient } = require('../../config/redis');
const MLService = require('../../services/ml.service');
const logger = require('../../utils/logger.utils');

const ZONE_CACHE_TTL = 360; // 6 minutes

/**
 * Compute hot zones for a city.
 * Job data: { city }
 *
 * Collects GPS coordinates from Redis stream →
 * calls ML service /zones/compute →
 * stores result in Redis with 6min TTL →
 * Socket.io broadcast zones:update to city room.
 */
zoneComputeQueue.process(2, async (job) => {
  const { city } = job.data;
  const hour = new Date().getHours();
  const cacheKey = `zones:${city}:${hour}`;

  logger.info('Zone worker processing', { jobId: job.id, city });

  try {
    // 1. Collect recent worker locations from Redis stream
    const locationKey = `worker_locations:${city}`;
    const rawLocations = await redisClient.lrange(locationKey, 0, -1);

    const workerLocations = rawLocations
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // If not enough data points, skip computation
    if (workerLocations.length < 5) {
      logger.info('Zone worker: insufficient location data', {
        city,
        dataPoints: workerLocations.length,
      });

      // Still cache an empty result so frontend doesn't hang
      const emptyResult = { type: 'FeatureCollection', features: [], city, hour };
      await redisClient.setex(cacheKey, ZONE_CACHE_TTL, JSON.stringify(emptyResult));

      return { city, zones: 0, dataPoints: workerLocations.length };
    }

    // 2. Call ML service for zone computation
    const zones = await MLService.getHotZones(city, new Date().toISOString());

    // 3. Cache in Redis with 6-minute TTL
    await redisClient.setex(cacheKey, ZONE_CACHE_TTL, JSON.stringify(zones));

    // 4. Broadcast via Socket.io to all users in this city room
    const io = global.__io;
    if (io) {
      io.to(`city:${city}`).emit('zones:update', {
        city,
        zones,
        timestamp: new Date().toISOString(),
      });
    }

    // 5. Clear processed location data (keep last 10 for continuity)
    const listLen = await redisClient.llen(locationKey);
    if (listLen > 10) {
      await redisClient.ltrim(locationKey, listLen - 10, -1);
    }

    const featureCount = zones?.features?.length || 0;
    logger.info('Zone worker completed', {
      city,
      zones: featureCount,
      dataPoints: workerLocations.length,
    });

    return { city, zones: featureCount, dataPoints: workerLocations.length };
  } catch (error) {
    logger.error('Zone worker failed', { city, error: error.message });

    // On failure, try to serve stale cache (don't expire it)
    const stale = await redisClient.get(cacheKey);
    if (!stale) {
      // Set empty so frontend doesn't retry endlessly
      const fallback = { type: 'FeatureCollection', features: [], city, hour, fallback: true };
      await redisClient.setex(cacheKey, ZONE_CACHE_TTL, JSON.stringify(fallback));
    }

    throw error;
  }
});

zoneComputeQueue.on('completed', (job, result) => {
  logger.debug(`Zone job #${job.id} completed`, result);
});

module.exports = zoneComputeQueue;
