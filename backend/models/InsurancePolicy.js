// ============================================================
// InsurancePolicy Model Helper — Policy & claim operations
// ============================================================

const prisma = require('../config/database');

const InsurancePolicyHelper = {
  // -----------------------------------------------------------
  // Get active policies for a user
  // -----------------------------------------------------------
  async getActivePolicies(userId) {
    return prisma.insurancePolicy.findMany({
      where: {
        userId,
        status: 'active',
        validTo: { gte: new Date() },
      },
      include: { claims: true },
      orderBy: { validTo: 'asc' },
    });
  },

  // -----------------------------------------------------------
  // Get all policies for a user (including expired)
  // -----------------------------------------------------------
  async getAllPolicies(userId) {
    return prisma.insurancePolicy.findMany({
      where: { userId },
      include: { claims: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  // -----------------------------------------------------------
  // Check for expiring policies (for notification scheduler)
  // -----------------------------------------------------------
  async getExpiringPolicies(withinDays = 3) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + withinDays);

    return prisma.insurancePolicy.findMany({
      where: {
        status: 'active',
        validTo: { lte: expiry, gte: new Date() },
      },
      include: { user: { select: { id: true, phone: true, name: true, fcmToken: true } } },
    });
  },

  // -----------------------------------------------------------
  // Expire policies past their valid_to date
  // -----------------------------------------------------------
  async expireOverduePolicies() {
    return prisma.insurancePolicy.updateMany({
      where: {
        status: 'active',
        validTo: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
  },

  // -----------------------------------------------------------
  // Submit a claim against a policy
  // -----------------------------------------------------------
  async submitClaim(policyId, claimData) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.insuranceClaim.create({
        data: {
          policyId,
          amountClaimed: claimData.amountClaimed,
          documents: claimData.documents || [],
          notes: claimData.notes,
        },
      });

      await tx.insurancePolicy.update({
        where: { id: policyId },
        data: { status: 'claimed' },
      });

      return claim;
    });
  },

  // -----------------------------------------------------------
  // Get claims for a user
  // -----------------------------------------------------------
  async getUserClaims(userId) {
    return prisma.insuranceClaim.findMany({
      where: { policy: { userId } },
      include: {
        policy: { select: { type: true, partner: true, coverAmount: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  },

  // -----------------------------------------------------------
  // Serialize for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(policy) {
    if (!policy) return null;
    return {
      ...policy,
      premiumPaid: Number(policy.premiumPaid),
      coverAmount: Number(policy.coverAmount),
      claims: policy.claims?.map((c) => ({
        ...c,
        amountClaimed: Number(c.amountClaimed),
        amountApproved: c.amountApproved ? Number(c.amountApproved) : null,
      })),
    };
  },
};

module.exports = InsurancePolicyHelper;
