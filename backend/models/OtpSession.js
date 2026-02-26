// ============================================================
// OtpSession Model — Query helpers
// Usage: const OtpSessionModel = require('../models/OtpSession');
// ============================================================

const { prisma } = require('../config/database');

const OtpSessionModel = {
    /**
     * Create a new OTP session.
     * Deletes any existing sessions for the same phone + purpose first.
     */
    async create(phone, otpHash, purpose, ttlMinutes = 10) {
        // Clean up old sessions for this phone + purpose
        await prisma.otpSession.deleteMany({
            where: { phone, purpose },
        });

        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

        return prisma.otpSession.create({
            data: {
                phone,
                otpHash,
                purpose,
                attempts: 0,
                expiresAt,
            },
        });
    },

    /**
     * Find a valid (non-expired) OTP session for a phone + purpose.
     */
    async findValid(phone, purpose) {
        return prisma.otpSession.findFirst({
            where: {
                phone,
                purpose,
                expiresAt: { gt: new Date() },
                attempts: { lt: 5 }, // Max 5 attempts
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    /**
     * Increment attempt count for a session.
     */
    async incrementAttempts(sessionId) {
        return prisma.otpSession.update({
            where: { id: sessionId },
            data: { attempts: { increment: 1 } },
        });
    },

    /**
     * Delete a session (after successful verification).
     */
    async delete(sessionId) {
        return prisma.otpSession.delete({
            where: { id: sessionId },
        });
    },

    /**
     * Cleanup expired OTP sessions.
     * Called by a scheduler or can be invoked manually.
     * This replaces the pg_cron approach for portability.
     */
    async cleanupExpired() {
        const result = await prisma.otpSession.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    },

    /**
     * Count recent OTP requests for rate limiting.
     * @param {string} phone
     * @param {number} windowMinutes
     */
    async countRecent(phone, windowMinutes = 10) {
        const since = new Date(Date.now() - windowMinutes * 60 * 1000);
        return prisma.otpSession.count({
            where: {
                phone,
                createdAt: { gte: since },
            },
        });
    },
};

module.exports = OtpSessionModel;
