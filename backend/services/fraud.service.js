// ============================================================
// Fraud Service — 4-rule fraud detection engine
// ============================================================

const logger = require('../utils/logger.utils');
const { prisma } = require('../config/database');
const { redisClient } = require('../config/redis');
const { haversineDistance } = require('../utils/geoUtils');
const { paiseToRupees } = require('../utils/formatters.utils');

const PAYOUT_VELOCITY_KEY = (userId) => `fraud:velocity:${userId}`;
const DEVICE_KEY = (userId) => `fraud:devices:${userId}`;

const FraudService = {
  /**
   * Run all fraud detection rules against a payout request.
   * @param {string} userId
   * @param {number} amount — in paise
   * @param {{ lat: number, lng: number }|null} location
   * @param {string|null} deviceFingerprint
   * @returns {Promise<{ flagged: boolean, blocked: boolean, reasons: string[], requiresVerification: boolean }>}
   */
  async checkPayoutFraud(userId, amount, location = null, deviceFingerprint = null) {
    const results = await Promise.allSettled([
      FraudService._checkAmountAnomaly(userId, amount),
      FraudService._checkLocationAnomaly(userId, location),
      FraudService._checkVelocity(userId),
      FraudService._checkNewDevice(userId, amount, deviceFingerprint),
    ]);

    const reasons = [];
    let flagged = false;
    let blocked = false;
    let requiresVerification = false;

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const r = result.value;
        if (r.flagged) flagged = true;
        if (r.blocked) blocked = true;
        if (r.requiresVerification) requiresVerification = true;
        if (r.reason) reasons.push(r.reason);
      }
    });

    if (flagged || blocked) {
      logger.warn('Fraud check triggered', {
        userId,
        amount: paiseToRupees(amount),
        flagged,
        blocked,
        reasons,
      });
    }

    return { flagged, blocked, reasons, requiresVerification };
  },

  /**
   * Rule 1: Amount exceeds 3× daily average → FLAG
   */
  async _checkAmountAnomaly(userId, amount) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const payouts = await prisma.payout.findMany({
      where: {
        userId,
        status: 'processed',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true },
    });

    if (payouts.length < 3) return null; // Not enough history

    const avgAmount =
      payouts.reduce((sum, p) => sum + Number(p.amount), 0) / payouts.length;

    if (amount > avgAmount * 3) {
      return {
        flagged: true,
        blocked: false,
        reason: `Amount ₹${paiseToRupees(amount)} is ${(amount / avgAmount).toFixed(1)}× your average payout of ₹${paiseToRupees(avgAmount)}`,
      };
    }

    return null;
  },

  /**
   * Rule 2: Location > 50 km from usual zone → FLAG
   */
  async _checkLocationAnomaly(userId, location) {
    if (!location || !location.lat || !location.lng) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { primaryCity: true },
    });

    if (!user?.primaryCity) return null;

    // Get recent payout locations from earnings data
    const recentEarnings = await prisma.earning.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      select: { metadata: true },
    });

    // Extract locations from metadata
    const recentLocations = recentEarnings
      .filter((e) => e.metadata?.lat && e.metadata?.lng)
      .map((e) => ({ lat: e.metadata.lat, lng: e.metadata.lng }));

    if (recentLocations.length === 0) return null;

    // Average recent location as "usual zone"
    const avgLat = recentLocations.reduce((s, l) => s + l.lat, 0) / recentLocations.length;
    const avgLng = recentLocations.reduce((s, l) => s + l.lng, 0) / recentLocations.length;

    const distance = haversineDistance(location.lat, location.lng, avgLat, avgLng);

    if (distance > 50) {
      return {
        flagged: true,
        blocked: false,
        reason: `Payout requested ${Math.round(distance)} km from your usual zone`,
      };
    }

    return null;
  },

  /**
   * Rule 3: 3+ payouts in 1 hour → BLOCK
   */
  async _checkVelocity(userId) {
    const key = PAYOUT_VELOCITY_KEY(userId);
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, 3600); // 1 hour window
    }

    if (count >= 3) {
      return {
        flagged: true,
        blocked: true,
        reason: `${count} payout requests in the last hour — temporarily blocked`,
      };
    }

    return null;
  },

  /**
   * Rule 4: New device + first withdrawal > ₹1,000 → extra verification required
   */
  async _checkNewDevice(userId, amount, deviceFingerprint) {
    if (!deviceFingerprint) return null;

    const deviceKey = DEVICE_KEY(userId);
    const isKnownDevice = await redisClient.sismember(deviceKey, deviceFingerprint);

    if (!isKnownDevice) {
      // Register the device
      await redisClient.sadd(deviceKey, deviceFingerprint);
      await redisClient.expire(deviceKey, 90 * 24 * 60 * 60); // 90 days

      // Check if amount exceeds threshold for new devices
      if (amount > 100000) {
        // ₹1,000 in paise
        return {
          flagged: true,
          blocked: false,
          requiresVerification: true,
          reason: `First withdrawal of ₹${paiseToRupees(amount)} from a new device — additional verification required`,
        };
      }
    }

    return null;
  },

  /**
   * Clear velocity counter (call after successful payout for rate reset on new period).
   */
  async resetVelocity(userId) {
    await redisClient.del(PAYOUT_VELOCITY_KEY(userId));
  },
};

module.exports = FraudService;
