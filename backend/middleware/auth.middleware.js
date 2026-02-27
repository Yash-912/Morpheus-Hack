// ============================================================
// Auth Middleware — JWT verification + user loading
// ============================================================

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

const PRIVATE_KEY = process.env.JWT_ACCESS_PRIVATE_KEY
  ? process.env.JWT_ACCESS_PRIVATE_KEY.replace(/\\n/g, '\n')
  : process.env.JWT_SECRET || 'dev-secret';

const PUBLIC_KEY = process.env.JWT_ACCESS_PUBLIC_KEY
  ? process.env.JWT_ACCESS_PUBLIC_KEY.replace(/\\n/g, '\n')
  : null;

const isAsymmetric = PUBLIC_KEY && PUBLIC_KEY !== PRIVATE_KEY && PRIVATE_KEY.includes('-----BEGIN');
const VERIFY_KEY = isAsymmetric ? PUBLIC_KEY : (process.env.JWT_ACCESS_PRIVATE_KEY || process.env.JWT_SECRET || 'dev-secret');
const JWT_ALGOS = isAsymmetric ? ['RS256'] : ['HS256'];

/**
 * Verifies Bearer token, loads user from DB, attaches req.user.
 * Returns 401 on any failure.
 */
async function authMiddleware(req, res, next) {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed authorization header' },
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, VERIFY_KEY, { algorithms: JWT_ALGOS });
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message },
      });
    }

    // Load user from DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        city: true,
        kycStatus: true,
        isActive: true,
        languagePref: true,
        gigScore: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found' },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account has been deactivated' },
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Authentication check failed' },
    });
  }
}

module.exports = authMiddleware;
module.exports.protect = authMiddleware;
