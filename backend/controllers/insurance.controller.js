// ============================================================
// Insurance Controller — plans, active policies, activate, claims
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const InsuranceService = require('../services/insurance.service');
const StorageService = require('../services/storage.service');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

const insuranceController = {
  /**
   * GET /api/insurance/plans
   */
  async getPlans(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { primaryCity: true, dateOfBirth: true },
      });

      const age = user?.dateOfBirth
        ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 30;

      const plans = await InsuranceService.getAvailablePlans({
        age,
        city: user?.primaryCity || 'bangalore',
      });

      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/insurance/active
   */
  async getActive(req, res, next) {
    try {
      const policies = await prisma.insurancePolicy.findMany({
        where: { userId: req.user.id, status: 'active' },
        orderBy: { createdAt: 'desc' },
      });

      const data = policies.map((p) => ({
        ...p,
        premium: Number(p.premium),
        coverAmount: Number(p.coverAmount),
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/insurance/activate
   */
  async activate(req, res, next) {
    try {
      const { type, duration } = req.body;
      const result = await InsuranceService.activatePolicy(req.user.id, type, duration);

      // Create DB record
      const policy = await prisma.insurancePolicy.create({
        data: {
          userId: req.user.id,
          type,
          provider: result.provider,
          policyNumber: result.policyId,
          premium: BigInt(result.premium),
          coverAmount: BigInt(result.coverAmount),
          startDate: result.startDate,
          endDate: result.endDate,
          status: 'active',
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...policy,
          premium: Number(policy.premium),
          coverAmount: Number(policy.coverAmount),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/insurance/claim
   */
  async submitClaim(req, res, next) {
    try {
      const { policyId, type, description, amount } = req.body;

      // Verify policy belongs to user
      const policy = await prisma.insurancePolicy.findFirst({
        where: { id: policyId, userId: req.user.id, status: 'active' },
      });

      if (!policy) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Active policy not found' },
        });
      }

      // Upload document if provided
      const documents = [];
      if (req.file) {
        const s3Key = `claims/${req.user.id}/${policyId}/${Date.now()}_${req.file.originalname}`;
        const url = await StorageService.uploadFile(req.file.buffer, s3Key, req.file.mimetype);
        documents.push(url);
      }

      const result = await InsuranceService.submitClaim(policy.policyNumber, {
        type,
        description,
        amount,
        documents,
      });

      res.status(201).json({
        success: true,
        data: {
          claimId: result.claimId,
          status: result.status,
          message: 'Claim submitted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/insurance/claims
   */
  async getClaims(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const skip = (page - 1) * limit;

      const policies = await prisma.insurancePolicy.findMany({
        where: { userId: req.user.id },
        select: { policyNumber: true },
      });

      // For now, return from DB. In production, would also check external API.
      const [claims, total] = await Promise.all([
        prisma.insurancePolicy.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.insurancePolicy.count({ where: { userId: req.user.id } }),
      ]);

      const data = claims.map((c) => ({
        ...c,
        premium: Number(c.premium),
        coverAmount: Number(c.coverAmount),
      }));

      res.json({
        success: true,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = insuranceController;
