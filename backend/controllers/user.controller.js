// ============================================================
// User Controller — profile operations
// ============================================================

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

// JWT signing (re-use the same key/algo as auth.controller)
const SIGN_KEY = process.env.JWT_ACCESS_PRIVATE_KEY
  ? process.env.JWT_ACCESS_PRIVATE_KEY.replace(/\\n/g, '\n')
  : process.env.JWT_SECRET || 'dev-secret';
const isAsymmetric = SIGN_KEY.includes('-----BEGIN');
const JWT_ALG = isAsymmetric ? 'RS256' : 'HS256';
const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES || '15m';

const ALLOWED_PROFILE_FIELDS = [
  'name', 'email', 'city', 'languagePref',
];

const userController = {
  /**
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          city: true,
          languagePref: true,
          kycStatus: true,
          gigScore: true,
          walletBalance: true,
          isActive: true,
          createdAt: true,
          platformAccounts: {
            select: { platform: true, isActive: true },
          },
          bankAccounts: {
            select: { id: true, bankName: true, accountNumber: true, isPrimary: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        });
      }

      // Convert BigInt for JSON serialization
      const profile = {
        ...user,
        walletBalance: Number(user.walletBalance),
      };

      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      // Filter to allowed fields only
      const updates = {};
      for (const field of ALLOWED_PROFILE_FIELDS) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_UPDATES', message: 'No valid fields to update' },
        });
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updates,
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          city: true,
          languagePref: true,
          kycStatus: true,
        },
      });

      logger.info('Profile updated', { userId: req.user.id, fields: Object.keys(updates) });

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/users/by-phone
   * INTERNAL — used by WhatsApp bot to authenticate on behalf of a user.
   * Requires x-bot-secret header matching GIGPAY_BOT_SECRET.
   * Returns user profile + a short-lived access token for that user.
   */
  async getByPhone(req, res, next) {
    try {
      // Validate bot secret
      const botSecret = req.headers['x-bot-secret'];
      const validSecret = process.env.GIGPAY_BOT_SECRET;

      if (!validSecret || botSecret !== validSecret) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Invalid bot secret' },
        });
      }

      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PHONE', message: 'phone query param required' },
        });
      }

      const user = await prisma.user.findUnique({
        where: { phone },
        select: {
          id: true, phone: true, name: true, city: true,
          kycStatus: true, isActive: true, languagePref: true,
          gigScore: true, walletBalance: true, homeLat: true, homeLng: true,
          bankAccounts: {
            where: { isPrimary: true },
            select: { upiId: true },
            take: 1,
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not registered' },
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_DISABLED', message: 'Account deactivated' },
        });
      }

      // Issue a short-lived access token for the bot to use
      const accessToken = jwt.sign(
        { userId: user.id, phone: user.phone },
        SIGN_KEY,
        { algorithm: JWT_ALG, expiresIn: ACCESS_TTL }
      );

      const primaryUpiId = user.bankAccounts?.[0]?.upiId || null;

      res.json({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          city: user.city,
          kycStatus: user.kycStatus,
          languagePref: user.languagePref,
          gigScore: user.gigScore,
          walletBalance: Number(user.walletBalance),
          homeLat: user.homeLat,
          homeLng: user.homeLng,
          primaryUpiId,
          accessToken,            // ← bot uses this as Bearer token
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
