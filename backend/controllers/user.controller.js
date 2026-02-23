// ============================================================
// User Controller — profile operations
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

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
};

module.exports = userController;
