// ============================================================
// GigScore Controller — overview, history, tier breakdown
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

/**
 * MOCK HELPER — Returns a realistic hardcoded GigScore breakdown.
 * TODO (Post-Hackathon): Replace with real algorithm that queries
 * the Earning table for CV, Loan table for repayment %, etc.
 */
function calculateMockGigScore(user) {
    // Sub-scores out of 100
    const breakdown = {
        consistency: 85,   // Earnings Consistency (35% weight)
        repayment: 100,    // Repayment History (30% weight)
        tenure: 50,        // Platform Tenure (15% weight)
        engagement: 90,    // App Engagement (10% weight)
        discipline: 40,    // Financial Discipline / Savings (10% weight)
    };

    // Weighted total mapped to 0–850
    const weightedRaw =
        breakdown.consistency * 0.35 +
        breakdown.repayment * 0.30 +
        breakdown.tenure * 0.15 +
        breakdown.engagement * 0.10 +
        breakdown.discipline * 0.10;

    const totalScore = Math.round((weightedRaw / 100) * 850);

    // Tier logic
    let tier = 1;
    if (totalScore >= 550) tier = 3;
    else if (totalScore >= 300) tier = 2;

    // Next tier threshold
    let nextTierThreshold = null;
    if (tier === 1) nextTierThreshold = 300;
    else if (tier === 2) nextTierThreshold = 550;
    else nextTierThreshold = 850;

    return { totalScore, tier, breakdown, nextTierThreshold };
}

const gigscoreController = {
    /**
     * GET /api/gigscore/overview
     * Returns the user's current GigScore, tier, and sub-score breakdown.
     */
    async getOverview(req, res, next) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    gigScore: true,
                    genesisScore: true,
                    onboardingTier: true,
                },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'User not found' },
                });
            }

            // Use the mock calculator (post-hackathon: use real algorithm)
            const scoreData = calculateMockGigScore(user);

            // If the user has a genesisScore from onboarding, use it to override
            if (user.genesisScore) {
                scoreData.totalScore = user.genesisScore;
            }

            // Use stored gigScore if it exists and is non-zero
            if (user.gigScore > 0) {
                scoreData.totalScore = user.gigScore;
            }

            // Recalculate tier based on actual score
            if (scoreData.totalScore >= 550) scoreData.tier = 3;
            else if (scoreData.totalScore >= 300) scoreData.tier = 2;
            else scoreData.tier = 1;

            // Tier labels for the frontend
            const tierLabels = {
                1: { name: 'Restricted', color: 'red', description: 'Complete more gigs to unlock credit' },
                2: { name: 'Emergency Active', color: 'yellow', description: 'Emergency micro-credit unlocked' },
                3: { name: 'NBFC Active', color: 'green', description: 'Full loan access unlocked' },
            };

            res.json({
                success: true,
                data: {
                    currentScore: scoreData.totalScore,
                    maxScore: 850,
                    tier: scoreData.tier,
                    tierInfo: tierLabels[scoreData.tier],
                    breakdown: scoreData.breakdown,
                    nextTierThreshold: scoreData.nextTierThreshold,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/gigscore/history
     * Returns the user's GigScore trend over the past months.
     */
    async getHistory(req, res, next) {
        try {
            const history = await prisma.gigScoreHistory.findMany({
                where: { userId: req.user.id },
                orderBy: { month: 'asc' },
            });

            const data = history.map((h) => ({
                month: h.month,
                totalScore: h.totalScore,
                breakdown: {
                    consistency: h.earningsConsistencyScore,
                    repayment: h.repaymentHistoryScore,
                    tenure: h.platformTenureScore,
                    engagement: h.engagementScore,
                    discipline: h.financialDisciplineScore,
                },
            }));

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/gigscore/eligibility
     * Returns what the user's current tier unlocks.
     */
    async getEligibility(req, res, next) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: { gigScore: true, onboardingTier: true },
            });

            const tier = user.onboardingTier || 1;
            const score = user.gigScore || 0;

            // Emergency fund limits based on score
            let emergencyLimit = 0;
            if (score >= 500) emergencyLimit = 1500;
            else if (score >= 400) emergencyLimit = 1000;
            else if (score >= 300) emergencyLimit = 500;

            // NBFC loan multiplier
            let nbfcMultiplier = 0;
            if (score >= 750) nbfcMultiplier = 3;
            else if (score >= 650) nbfcMultiplier = 2;
            else if (score >= 550) nbfcMultiplier = 1;

            res.json({
                success: true,
                data: {
                    tier,
                    score,
                    unlocked: {
                        payoutRouting: true,
                        microSavings: true,
                        emergencyCredit: tier >= 2,
                        nbfcLoans: tier >= 3,
                    },
                    limits: {
                        emergencyFundMax: emergencyLimit,
                        nbfcLoanMultiplier: nbfcMultiplier,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = gigscoreController;
