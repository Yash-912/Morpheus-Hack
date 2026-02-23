// ============================================================
// ML Service Client — proxy calls to the Python FastAPI ML microservice
// ============================================================

const axios = require('axios');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger.utils');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = 10000; // 10s

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

const MLService = {
  /**
   * Get earnings forecast for a user for a target date.
   * Falls back to Redis-cached result on ML service failure.
   * @param {string} userId
   * @param {string} targetDate — YYYY-MM-DD
   * @returns {Promise<{min, max, expected, confidence, factors}>}
   */
  async getEarningsForecast(userId, targetDate) {
    const cacheKey = `forecast:${userId}:${targetDate}`;

    try {
      const { data } = await mlClient.post('/predict/earnings', {
        user_id: userId,
        target_date: targetDate,
      });

      // Cache result for 6 hours
      await redisClient.setex(cacheKey, 6 * 3600, JSON.stringify(data));

      return data;
    } catch (error) {
      logger.warn('ML earnings forecast failed, checking cache:', error.message);

      // Fallback to cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return {
        min: 0,
        max: 0,
        expected: 0,
        confidence: 0,
        factors: {},
        fallback: true,
      };
    }
  },

  /**
   * Get hot zones for a city at the current time.
   * @param {string} city
   * @param {string} [timestamp] — ISO timestamp, defaults to now
   * @returns {Promise<object>} GeoJSON FeatureCollection
   */
  async getHotZones(city, timestamp) {
    const hour = new Date(timestamp || Date.now()).getHours();
    const cacheKey = `zones:${city}:${hour}`;

    try {
      const { data } = await mlClient.get(`/zones/${city}`, {
        params: { timestamp: timestamp || new Date().toISOString() },
      });

      // Cache for 6 minutes
      await redisClient.setex(cacheKey, 360, JSON.stringify(data));

      return data;
    } catch (error) {
      logger.warn(`ML hot zones failed for ${city}, checking cache:`, error.message);

      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return { type: 'FeatureCollection', features: [], fallback: true };
    }
  },

  /**
   * Classify SMS messages as expenses.
   * @param {Array<{body: string, timestamp: string}>} messages
   * @returns {Promise<Array<{category, amount, merchant, date, is_tax_deductible, confidence}>>}
   */
  async classifySmsMessages(messages) {
    try {
      const { data } = await mlClient.post('/sms/classify', { messages });
      return data.classified || data;
    } catch (error) {
      logger.error('ML SMS classification failed:', error.message);
      return [];
    }
  },

  /**
   * Get algorithm insights for a platform/city.
   * @param {string} platform
   * @param {string} city
   * @returns {Promise<Array>}
   */
  async getAlgoInsights(platform, city) {
    const cacheKey = `insights:${platform}:${city}`;

    try {
      const { data } = await mlClient.get(`/insights/${platform}/${city}`);

      await redisClient.setex(cacheKey, 3600, JSON.stringify(data));

      return data;
    } catch (error) {
      logger.warn('ML algo insights failed, checking cache:', error.message);

      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return [];
    }
  },

  /**
   * Health check on the ML service.
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const { data } = await mlClient.get('/health', { timeout: 3000 });
      return data.status === 'ok';
    } catch {
      return false;
    }
  },
};

module.exports = MLService;
