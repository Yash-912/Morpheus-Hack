// ============================================================
// OtpSession Model Helper — OTP creation, verification, cleanup
// ============================================================

const crypto = require('crypto');
const prisma = require('../config/database');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const OtpSessionHelper = {
  // -----------------------------------------------------------
  // Generate a 6-digit OTP and store a hashed version
  // -----------------------------------------------------------
  async create(phone, purpose = 'login') {
    // Invalidate any existing OTPs for this phone + purpose
    await prisma.otpSession.updateMany({
      where: { phone, purpose, verified: false },
      data: { verified: true }, // mark as consumed
    });

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash with SHA-256 (no need for bcrypt — short-lived, rate-limited)
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpSession.create({
      data: {
        phone,
        otpHash: hash,
        purpose,
        expiresAt,
      },
    });

    // Return the plain OTP (to be sent via SMS/WhatsApp)
    return { otp, expiresAt };
  },

  // -----------------------------------------------------------
  // Verify an OTP against the stored hash
  // -----------------------------------------------------------
  async verify(phone, otp, purpose = 'login') {
    const session = await prisma.otpSession.findFirst({
      where: {
        phone,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return { valid: false, reason: 'OTP_EXPIRED_OR_NOT_FOUND' };
    }

    if (session.attempts >= MAX_ATTEMPTS) {
      return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED' };
    }

    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    if (hash !== session.otpHash) {
      // Increment attempts counter
      await prisma.otpSession.update({
        where: { id: session.id },
        data: { attempts: { increment: 1 } },
      });
      return { valid: false, reason: 'INVALID_OTP' };
    }

    // Mark as verified
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    return { valid: true, sessionId: session.id };
  },

  // -----------------------------------------------------------
  // Cleanup expired sessions (cron job — run daily)
  // -----------------------------------------------------------
  async cleanupExpired() {
    const result = await prisma.otpSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { verified: true },
        ],
      },
    });
    return result.count;
  },

  // -----------------------------------------------------------
  // Rate-limit check — max OTPs per phone in a time window
  // -----------------------------------------------------------
  async getRecentCount(phone, windowMinutes = 60) {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    return prisma.otpSession.count({
      where: {
        phone,
        createdAt: { gte: since },
      },
    });
  },
};

module.exports = OtpSessionHelper;
