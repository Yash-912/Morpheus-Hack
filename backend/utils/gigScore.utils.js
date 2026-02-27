// ============================================================
// GigScore Algorithm — credit-like score for gig workers (0–850)
// Factors: earnings consistency, tenure, repayment, ratings, engagement
// Recalculated nightly via cron
// ============================================================

const { prisma } = require('../config/database');

const MAX_SCORE = 850;

// Weight allocation
const WEIGHTS = {
  earningsConsistency: 0.30, // 30% — CV of last 30 days earnings
  platformTenure: 0.20,     // 20% — months since first earning
  repaymentHistory: 0.25,   // 25% — on-time repayment %
  platformRatings: 0.15,    // 15% — average ratings across platforms
  appEngagement: 0.10,      // 10% — active days in last 30
};

/**
 * Calculate GigScore for a user.
 * @param {string} userId
 * @returns {Promise<{score: number, breakdown: object}>}
 */
async function calculateGigScore(userId) {
  const [earningsData, tenure, repayment, ratings, engagement] = await Promise.all([
    getEarningsConsistencyScore(userId),
    getPlatformTenureScore(userId),
    getRepaymentScore(userId),
    getPlatformRatingsScore(userId),
    getAppEngagementScore(userId),
  ]);

  const rawScore =
    earningsData.score * WEIGHTS.earningsConsistency +
    tenure.score * WEIGHTS.platformTenure +
    repayment.score * WEIGHTS.repaymentHistory +
    ratings.score * WEIGHTS.platformRatings +
    engagement.score * WEIGHTS.appEngagement;

  const score = Math.round(rawScore * MAX_SCORE);

  const breakdown = {
    earningsConsistency: {
      weight: WEIGHTS.earningsConsistency,
      score: earningsData.score,
      points: Math.round(earningsData.score * WEIGHTS.earningsConsistency * MAX_SCORE),
      details: earningsData.details,
    },
    platformTenure: {
      weight: WEIGHTS.platformTenure,
      score: tenure.score,
      points: Math.round(tenure.score * WEIGHTS.platformTenure * MAX_SCORE),
      details: tenure.details,
    },
    repaymentHistory: {
      weight: WEIGHTS.repaymentHistory,
      score: repayment.score,
      points: Math.round(repayment.score * WEIGHTS.repaymentHistory * MAX_SCORE),
      details: repayment.details,
    },
    platformRatings: {
      weight: WEIGHTS.platformRatings,
      score: ratings.score,
      points: Math.round(ratings.score * WEIGHTS.platformRatings * MAX_SCORE),
      details: ratings.details,
    },
    appEngagement: {
      weight: WEIGHTS.appEngagement,
      score: engagement.score,
      points: Math.round(engagement.score * WEIGHTS.appEngagement * MAX_SCORE),
      details: engagement.details,
    },
  };

  return { score, breakdown };
}

// ---- Sub-score: Earnings Consistency (inverse CV) ----
async function getEarningsConsistencyScore(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const earnings = await prisma.earning.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    select: { netAmount: true },
  });

  if (earnings.length < 5) {
    return { score: 0.2, details: { daysWithEarnings: earnings.length, cv: null } };
  }

  const amounts = earnings.map((e) => Number(e.netAmount));
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + (val - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1; // Coefficient of variation

  // Lower CV = more consistent = higher score
  // CV of 0 → score 1.0, CV of 1+ → score ~0.2
  const score = Math.max(0.1, Math.min(1.0, 1 - cv * 0.8));

  return { score, details: { daysWithEarnings: earnings.length, cv: cv.toFixed(3) } };
}

// ---- Sub-score: Platform Tenure (months since first earning) ----
async function getPlatformTenureScore(userId) {
  const firstEarning = await prisma.earning.findFirst({
    where: { userId },
    orderBy: { date: 'asc' },
    select: { date: true },
  });

  if (!firstEarning) {
    return { score: 0.1, details: { monthsActive: 0 } };
  }

  const monthsActive = Math.floor(
    (Date.now() - firstEarning.date.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  // Score scales linearly: 0 months → 0.1, 12+ months → 1.0
  const score = Math.min(1.0, 0.1 + (monthsActive / 12) * 0.9);

  return { score, details: { monthsActive, since: firstEarning.date.toISOString() } };
}

// ---- Sub-score: Repayment History ----
async function getRepaymentScore(userId) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    include: { repaymentHistory: true },
  });

  if (loans.length === 0) {
    // No loan history — neutral score
    return { score: 0.6, details: { totalLoans: 0, onTimePercent: null } };
  }

  const hasDefaults = loans.some((l) => l.status === 'defaulted');
  if (hasDefaults) {
    return { score: 0.1, details: { totalLoans: loans.length, hasDefaults: true } };
  }

  const repaidLoans = loans.filter((l) => l.status === 'repaid');
  const onTimePercent = loans.length > 0 ? repaidLoans.length / loans.length : 0;

  const score = Math.max(0.2, onTimePercent);

  return {
    score,
    details: {
      totalLoans: loans.length,
      repaidLoans: repaidLoans.length,
      onTimePercent: (onTimePercent * 100).toFixed(1) + '%',
    },
  };
}

// ---- Sub-score: Platform Ratings ----
async function getPlatformRatingsScore(userId) {
  const accounts = await prisma.platformAccount.findMany({
    where: { userId, isActive: true },
    select: { platform: true },
  });

  if (accounts.length === 0) {
    return { score: 0.5, details: { platforms: 0, avgRating: null } };
  }

  // Without ratings on the model, use a neutral score based on platform count
  const score = Math.min(1.0, 0.3 + (accounts.length * 0.15));

  return { score, details: { platforms: accounts.length, avgRating: null } };
}

// ---- Sub-score: App Engagement (active days in last 30) ----
async function getAppEngagementScore(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count distinct dates with earnings (proxy for active days)
  const earnings = await prisma.earning.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    select: { date: true },
    distinct: ['date'],
  });

  const activeDays = earnings.length;
  // Score: activeDays/30
  const score = Math.min(1.0, activeDays / 30);

  return { score, details: { activeDays, outOf: 30 } };
}

/**
 * Recalculate and persist GigScore for a user.
 * @param {string} userId
 * @returns {Promise<number>} Updated score
 */
async function updateGigScore(userId) {
  const { score, breakdown } = await calculateGigScore(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      gigScore: score,
    },
  });

  return score;
}

/**
 * Batch recalculate GigScores for all active users (nightly cron).
 */
async function recalculateAllScores() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let updated = 0;
  for (const user of users) {
    try {
      await updateGigScore(user.id);
      updated++;
    } catch (err) {
      console.error(`GigScore update failed for ${user.id}:`, err.message);
    }
  }

  return { total: users.length, updated };
}

module.exports = {
  calculateGigScore,
  updateGigScore,
  recalculateAllScores,
  MAX_SCORE,
  WEIGHTS,
};
