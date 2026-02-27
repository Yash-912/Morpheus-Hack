// ============================================================
// Platform Service — Earnings sync from gig platforms
// Zomato, Swiggy, Ola, Uber partner API integrations
// ============================================================

const axios = require('axios');
const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

// Platform API base URLs (would come from env in production)
const PLATFORM_APIS = {
  zomato: process.env.ZOMATO_PARTNER_API || 'https://partner-api.zomato.com',
  swiggy: process.env.SWIGGY_PARTNER_API || 'https://partner-api.swiggy.com',
  ola: process.env.OLA_PARTNER_API || 'https://partner-api.olacabs.com',
  uber: process.env.UBER_PARTNER_API || 'https://partner-api.uber.com',
};

const PlatformService = {
  /**
   * Fetch earnings from Zomato partner API.
   * @param {string} token — platform OAuth/API token
   * @param {string} date — YYYY-MM-DD
   * @returns {Promise<{amount, trips, onlineHours, date}>}
   */
  async getZomatoEarnings(token, date) {
    try {
      const { data } = await axios.get(`${PLATFORM_APIS.zomato}/v1/earnings`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      return {
        amount: Math.round(data.total_earnings * 100), // Convert to paise
        trips: data.total_orders || 0,
        onlineHours: data.online_hours || 0,
        date: new Date(date),
      };
    } catch (error) {
      logger.warn(`Zomato earnings fetch failed for ${date}:`, error.message);
      return null;
    }
  },

  /**
   * Fetch earnings from Swiggy partner API.
   */
  async getSwiggyEarnings(token, date) {
    try {
      const { data } = await axios.get(`${PLATFORM_APIS.swiggy}/v1/partner/earnings`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      return {
        amount: Math.round(data.net_earnings * 100),
        trips: data.deliveries || 0,
        onlineHours: data.active_hours || 0,
        date: new Date(date),
      };
    } catch (error) {
      logger.warn(`Swiggy earnings fetch failed for ${date}:`, error.message);
      return null;
    }
  },

  /**
   * Fetch earnings from Ola partner API.
   */
  async getOlaEarnings(token, date) {
    try {
      const { data } = await axios.get(`${PLATFORM_APIS.ola}/v1/driver/earnings`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      return {
        amount: Math.round(data.total_earnings * 100),
        trips: data.trips_completed || 0,
        onlineHours: data.online_hours || 0,
        date: new Date(date),
      };
    } catch (error) {
      logger.warn(`Ola earnings fetch failed for ${date}:`, error.message);
      return null;
    }
  },

  /**
   * Fetch earnings from Uber partner API.
   */
  async getUberEarnings(token, date) {
    try {
      const { data } = await axios.get(`${PLATFORM_APIS.uber}/v1/partners/earnings`, {
        params: { start_date: date, end_date: date },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      return {
        amount: Math.round((data.earnings?.total || 0) * 100),
        trips: data.trips?.count || 0,
        onlineHours: data.online_time?.hours || 0,
        date: new Date(date),
      };
    } catch (error) {
      logger.warn(`Uber earnings fetch failed for ${date}:`, error.message);
      return null;
    }
  },

  /**
   * Sync earnings across all connected platforms for a user.
   * Upserts records for the given date.
   * @param {string} userId
   * @param {string} [date] — YYYY-MM-DD, defaults to today
   * @returns {Promise<{synced: string[], failed: string[], needsScreenshot: string[]}>}
   */
  async syncAllPlatforms(userId, date) {
    if (!date) {
      const d = new Date();
      date = d.toISOString().split('T')[0];
    }

    const accounts = await prisma.platformAccount.findMany({
      where: { userId, isActive: true },
    });

    const results = { synced: [], failed: [], needsScreenshot: [] };

    const fetcherMap = {
      zomato: PlatformService.getZomatoEarnings,
      swiggy: PlatformService.getSwiggyEarnings,
      ola: PlatformService.getOlaEarnings,
      uber: PlatformService.getUberEarnings,
    };

    for (const account of accounts) {
      const fetcher = fetcherMap[account.platform];

      if (!fetcher || !account.accessToken) {
        results.needsScreenshot.push(account.platform);
        continue;
      }

      const earnings = await fetcher(account.accessToken, date);

      if (!earnings) {
        results.failed.push(account.platform);
        results.needsScreenshot.push(account.platform);
        continue;
      }

      // Create the earning record (no compound unique, so just create)
      await prisma.earning.create({
        data: {
          userId,
          platform: account.platform,
          date: new Date(date),
          grossAmount: BigInt(earnings.amount),
          netAmount: BigInt(earnings.amount),
          tripsCount: earnings.trips,
          hoursWorked: earnings.onlineHours,
          source: 'api',
        },
      });

      results.synced.push(account.platform);
    }

    logger.info('Platform sync completed', { userId, date, results });
    return results;
  },
};

module.exports = PlatformService;
