// ============================================================
// Credit Tier Gate Middleware — Blocks credit for Tier 1 users
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

/**
 * Middleware: creditTierGate
 * Blocks POST /api/credit/apply if user's onboardingTier < 2.
 * Tier 1 = Restricted (no credit access).
 * Tier 2 = Emergency Fund only.
 * Tier 3 = NBFC loans unlocked.
 */
async function creditTierGate(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { onboardingTier: true, gigScore: true },
        });

        if (!user || user.onboardingTier < 2) {
            logger.warn('Credit tier gate blocked', {
                userId: req.user.id,
                tier: user?.onboardingTier,
            });

            return res.status(403).json({
                success: false,
                error: {
                    code: 'TIER_INSUFFICIENT',
                    message: 'You need a GigScore of 300+ (Tier 2) to access Emergency Funds. Keep completing gigs to build your score!',
                    currentTier: user?.onboardingTier || 1,
                    currentScore: user?.gigScore || 0,
                    requiredTier: 2,
                    requiredScore: 300,
                },
            });
        }

        // Attach tier info for controller use
        req.creditContext = {
            tier: user.onboardingTier,
            score: user.gigScore,
        };
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = creditTierGate;
