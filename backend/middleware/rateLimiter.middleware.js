// ============================================================
// Rate Limiter Middleware — Redis-backed rate limiting
// ============================================================

const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger.utils');

/**
 * Custom Redis store for express-rate-limit.
 * Uses ioredis sliding-window counters.
 */
class RedisStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.prefix = 'rl:';
  }

  async increment(key) {
    const redisKey = `${this.prefix}${key}`;
    const multi = redisClient.multi();
    multi.incr(redisKey);
    multi.pttl(redisKey);
    const results = await multi.exec();

    const totalHits = results[0][1];
    const pttl = results[1][1];

    // Set expiry on first hit
    if (pttl === -1 || pttl === -2) {
      await redisClient.pexpire(redisKey, this.windowMs);
    }

    return {
      totalHits,
      resetTime: new Date(Date.now() + (pttl > 0 ? pttl : this.windowMs)),
    };
  }

  async decrement(key) {
    const redisKey = `${this.prefix}${key}`;
    await redisClient.decr(redisKey);
  }

  async resetKey(key) {
    const redisKey = `${this.prefix}${key}`;
    await redisClient.del(redisKey);
  }
}

// ---- Rate limiters for different endpoint types ----

/**
 * OTP rate limiter — 3 requests per phone per 10 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  keyGenerator: (req) => `otp:${req.body.phone || req.ip}`,
  store: new RedisStore(10 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_OTP',
      message: 'Too many OTP requests. Please try again in 10 minutes.',
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`OTP rate limit hit: ${req.body.phone || req.ip}`);
    res.status(429).json(options.message);
  },
});

/**
 * Payout rate limiter — 10 requests per user per hour
 */
const payoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => `payout:${req.user?.id || req.ip}`,
  store: new RedisStore(60 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_PAYOUT',
      message: 'Too many payout requests. Please try again later.',
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Payout rate limit hit: ${req.user?.id || req.ip}`);
    res.status(429).json(options.message);
  },
});

/**
 * General API rate limiter — 100 requests per IP per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req) => `general:${req.ip}`,
  store: new RedisStore(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests. Please slow down.',
    },
  },
});

/**
 * Auth endpoint rate limiter — 20 requests per IP per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyGenerator: (req) => `auth:${req.ip}`,
  store: new RedisStore(15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_AUTH',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

module.exports = {
  otpLimiter,
  payoutLimiter,
  generalLimiter,
  authLimiter,
};
