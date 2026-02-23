// ============================================================
// Biometric Middleware — Withdrawal token verification via Redis
// Single-use, 5-minute TTL tokens issued after biometric auth
// ============================================================

const { redisClient } = require('../config/redis');
const logger = require('../utils/logger.utils');

/**
 * Verifies a single-use withdrawal token from the request body.
 * Token format in Redis: `withdrawal_token:{userId}:{token}`
 * Deletes token after successful verification (single-use).
 */
async function biometricMiddleware(req, res, next) {
  try {
    const { withdrawal_token: token } = req.body;
    const userId = req.user?.id;

    if (!token) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'BIOMETRIC_REQUIRED',
          message: 'Biometric verification required. Please authenticate first.',
        },
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const redisKey = `withdrawal_token:${userId}:${token}`;
    const exists = await redisClient.get(redisKey);

    if (!exists) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_WITHDRAWAL_TOKEN',
          message: 'Withdrawal token is invalid or expired. Please re-authenticate.',
        },
      });
    }

    // Delete token — single use
    await redisClient.del(redisKey);

    // Remove withdrawal_token from body so it doesn't leak into business logic
    delete req.body.withdrawal_token;

    next();
  } catch (error) {
    logger.error('Biometric middleware error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Biometric verification check failed' },
    });
  }
}

module.exports = biometricMiddleware;
