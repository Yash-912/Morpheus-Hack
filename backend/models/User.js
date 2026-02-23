// ============================================================
// User Model Helper — Business logic, computed fields, auth tokens
// ============================================================

const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const UserHelper = {
  // -----------------------------------------------------------
  // Computed: Check if user has full KYC verification
  // -----------------------------------------------------------
  fullKycVerified(user) {
    return user.kycStatus === 'verified' && user.faceEmbedding !== null;
  },

  // -----------------------------------------------------------
  // Generate JWT access + refresh tokens (RS256)
  // -----------------------------------------------------------
  generateAuthTokens(user) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      kycStatus: user.kycStatus,
      tier: user.subscriptionTier,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_PRIVATE_KEY, {
      algorithm: 'RS256',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      issuer: 'gigpay',
    });

    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d',
        issuer: 'gigpay',
      }
    );

    return { accessToken, refreshToken };
  },

  // -----------------------------------------------------------
  // Find by phone with common includes
  // -----------------------------------------------------------
  async findByPhone(phone, includeRelations = false) {
    const include = includeRelations
      ? { platformAccounts: true, bankAccounts: true }
      : undefined;

    return prisma.user.findUnique({
      where: { phone },
      include,
    });
  },

  // -----------------------------------------------------------
  // Find by ID with common includes
  // -----------------------------------------------------------
  async findById(id, includeRelations = false) {
    const include = includeRelations
      ? { platformAccounts: true, bankAccounts: true }
      : undefined;

    return prisma.user.findUnique({
      where: { id },
      include,
    });
  },

  // -----------------------------------------------------------
  // Upsert user on OTP verification (create if new, update lastSeen)
  // -----------------------------------------------------------
  async upsertOnLogin(phone) {
    return prisma.user.upsert({
      where: { phone },
      update: { lastSeen: new Date() },
      create: { phone, lastSeen: new Date() },
      include: { platformAccounts: true, bankAccounts: true },
    });
  },

  // -----------------------------------------------------------
  // Update wallet balance atomically (critical for financial ops)
  // Uses raw SQL for safe concurrent updates
  // -----------------------------------------------------------
  async updateWalletBalance(userId, { balanceDelta = 0, lockedDelta = 0 }) {
    return prisma.$executeRaw`
      UPDATE users
      SET wallet_balance = wallet_balance + ${balanceDelta}::bigint,
          wallet_locked_balance = wallet_locked_balance + ${lockedDelta}::bigint,
          updated_at = NOW()
      WHERE id = ${userId}::uuid
        AND wallet_balance + ${balanceDelta}::bigint >= 0
        AND wallet_locked_balance + ${lockedDelta}::bigint >= 0
    `;
  },

  // -----------------------------------------------------------
  // Record a withdrawal (atomically update balance + lifetime)
  // -----------------------------------------------------------
  async recordWithdrawal(userId, amount) {
    return prisma.$executeRaw`
      UPDATE users
      SET wallet_balance = wallet_balance - ${amount}::bigint,
          wallet_lifetime_withdrawn = wallet_lifetime_withdrawn + ${amount}::bigint,
          updated_at = NOW()
      WHERE id = ${userId}::uuid
        AND wallet_balance >= ${amount}::bigint
    `;
  },

  // -----------------------------------------------------------
  // Record earnings credit to wallet
  // -----------------------------------------------------------
  async recordEarningsCredit(userId, amount) {
    return prisma.$executeRaw`
      UPDATE users
      SET wallet_balance = wallet_balance + ${amount}::bigint,
          wallet_lifetime_earned = wallet_lifetime_earned + ${amount}::bigint,
          updated_at = NOW()
      WHERE id = ${userId}::uuid
    `;
  },

  // -----------------------------------------------------------
  // Get wallet snapshot
  // -----------------------------------------------------------
  async getWallet(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        walletLockedBalance: true,
        walletLifetimeEarned: true,
        walletLifetimeWithdrawn: true,
      },
    });
    return user;
  },

  // -----------------------------------------------------------
  // Update GigScore
  // -----------------------------------------------------------
  async updateGigScore(userId, score) {
    return prisma.user.update({
      where: { id: userId },
      data: { gigScore: Math.min(850, Math.max(0, Math.round(score))) },
    });
  },

  // -----------------------------------------------------------
  // Sanitize user object for API response (remove sensitive fields)
  // -----------------------------------------------------------
  sanitize(user) {
    if (!user) return null;
    const { pan, faceEmbedding, webauthnPublicKey, ...safe } = user;

    // Convert BigInt wallet fields to numbers for JSON serialization
    if (safe.walletBalance !== undefined) safe.walletBalance = Number(safe.walletBalance);
    if (safe.walletLockedBalance !== undefined) safe.walletLockedBalance = Number(safe.walletLockedBalance);
    if (safe.walletLifetimeEarned !== undefined) safe.walletLifetimeEarned = Number(safe.walletLifetimeEarned);
    if (safe.walletLifetimeWithdrawn !== undefined) safe.walletLifetimeWithdrawn = Number(safe.walletLifetimeWithdrawn);

    return safe;
  },
};

module.exports = UserHelper;
