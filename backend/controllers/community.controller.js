// ============================================================
// Community Controller — jobs CRUD, escrow, accept, complete, confirm, rate
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const CommunityService = require('../services/community.service');
const { COMMUNITY_PLATFORM_FEE } = require('../config/constants');

const communityController = {
  /**
   * GET /api/community/jobs
   * Nearby jobs via PostGIS geospatial query.
   */
  async nearbyJobs(req, res, next) {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseInt(req.query.radius, 10) || 10; // default 10 km
      const type = req.query.type || null;

      // Raw PostGIS query for nearby open jobs
      const radiusMeters = radius * 1000;
      const jobs = await prisma.$queryRaw`
        SELECT j.*,
          ST_Distance(ST_SetSRID(ST_MakePoint(j.geo_lng, j.geo_lat), 4326)::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS distance_m,
          u.name AS poster_name
        FROM "community_jobs" j
        JOIN "users" u ON u.id = j.posted_by
        WHERE j.status = 'open'
          AND ST_DWithin(ST_SetSRID(ST_MakePoint(j.geo_lng, j.geo_lat), 4326)::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})
          ${type ? prisma.$queryRaw`AND j.type = ${type}` : prisma.$queryRaw``}
        ORDER BY distance_m ASC
        LIMIT 50
      `;

      const data = jobs.map((j) => ({
        ...j,
        amount: Number(j.offered_price),
        escrowAmount: Number(j.escrow_amount || 0),
        distanceKm: Math.round((Number(j.distance_m) / 1000) * 10) / 10,
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/community/jobs
   * Post job with escrow from wallet.
   */
  async createJob(req, res, next) {
    try {
      const { title, description, type, amount, lat, lng, address } = req.body;

      // Verify wallet balance for escrow
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || Number(user.walletBalance) < amount) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_BALANCE', message: 'Wallet balance insufficient for escrow' },
        });
      }

      // Atomic: deduct escrow + create job
      const job = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: req.user.id },
          data: { walletBalance: { decrement: BigInt(amount) } },
        });

        return tx.communityJob.create({
          data: {
            postedById: req.user.id,
            title,
            description,
            type,
            offeredPrice: BigInt(amount),
            escrowAmount: BigInt(amount),
            pickupLat: lat,
            pickupLng: lng,
            pickupAddress: address || '',
            status: 'open',
          },
        });
      });

      logger.info('Community job created', { jobId: job.id, userId: req.user.id, amount });

      res.status(201).json({
        success: true,
        data: { ...job, offeredPrice: Number(job.offeredPrice), escrowAmount: Number(job.escrowAmount) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/community/jobs/:id
   */
  async jobDetail(req, res, next) {
    try {
      const job = await prisma.communityJob.findUnique({
        where: { id: req.params.id },
        include: {
          postedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' },
        });
      }

      res.json({
        success: true,
        data: { ...job, amount: Number(job.offeredPrice), escrowAmount: Number(job.escrowAmount) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/community/jobs/:id/accept
   * Accept job, status → assigned.
   */
  async acceptJob(req, res, next) {
    try {
      const job = await prisma.communityJob.findUnique({ where: { id: req.params.id } });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' },
        });
      }

      if (job.status !== 'open') {
        return res.status(409).json({
          success: false,
          error: { code: 'NOT_AVAILABLE', message: 'Job is no longer available' },
        });
      }

      if (job.postedById === req.user.id) {
        return res.status(400).json({
          success: false,
          error: { code: 'SELF_ACCEPT', message: 'Cannot accept your own job' },
        });
      }

      const updated = await prisma.communityJob.update({
        where: { id: req.params.id },
        data: { assignedToId: req.user.id, status: 'assigned' },
      });

      logger.info('Community job accepted', { jobId: job.id, workerId: req.user.id });

      res.json({
        success: true,
        data: { ...updated, amount: Number(updated.offeredPrice), escrowAmount: Number(updated.escrowAmount) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/community/jobs/:id/complete
   * Worker marks job complete.
   */
  async completeJob(req, res, next) {
    try {
      const job = await prisma.communityJob.findUnique({ where: { id: req.params.id } });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' },
        });
      }

      if (job.assignedToId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_WORKER', message: 'Only the assigned worker can mark complete' },
        });
      }

      if (job.status !== 'assigned') {
        return res.status(409).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'Job must be in assigned state' },
        });
      }

      const updated = await prisma.communityJob.update({
        where: { id: req.params.id },
        data: { status: 'completed' },
      });

      res.json({
        success: true,
        data: { ...updated, amount: Number(updated.offeredPrice), escrowAmount: Number(updated.escrowAmount) },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/community/jobs/:id/confirm
   * Customer confirms → release escrow minus 5% platform fee.
   */
  async confirmJob(req, res, next) {
    try {
      const job = await prisma.communityJob.findUnique({ where: { id: req.params.id } });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' },
        });
      }

      if (job.postedById !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_POSTER', message: 'Only the job poster can confirm completion' },
        });
      }

      if (job.status !== 'completed') {
        return res.status(409).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'Job must be in completed state to confirm' },
        });
      }

      const escrow = Number(job.escrowAmount);
      const platformFee = Math.round(escrow * COMMUNITY_PLATFORM_FEE);
      const workerPayout = escrow - platformFee;

      // Atomic: release escrow to worker wallet, update job
      await prisma.$transaction(async (tx) => {
        // Credit worker wallet
        await tx.user.update({
          where: { id: job.assignedToId },
          data: { walletBalance: { increment: BigInt(workerPayout) } },
        });

        await tx.communityJob.update({
          where: { id: job.id },
          data: {
            status: 'confirmed',
          },
        });
      });

      logger.info('Community job confirmed, escrow released', {
        jobId: job.id,
        workerPayout,
        platformFee,
      });

      res.json({
        success: true,
        data: {
          jobId: job.id,
          escrow,
          platformFee,
          workerPayout,
          status: 'confirmed',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/community/jobs/:id/rate
   */
  async rateJob(req, res, next) {
    try {
      const job = await prisma.communityJob.findUnique({ where: { id: req.params.id } });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' },
        });
      }

      if (job.status !== 'confirmed') {
        return res.status(409).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'Job must be confirmed before rating' },
        });
      }

      // Poster rates worker, or worker rates poster
      const isRaterPoster = job.postedById === req.user.id;
      const isRaterWorker = job.assignedToId === req.user.id;

      if (!isRaterPoster && !isRaterWorker) {
        return res.status(403).json({
          success: false,
          error: { code: 'NOT_PARTICIPANT', message: 'Only job participants can rate' },
        });
      }

      const { rating, review } = req.body;

      const updateData = isRaterPoster ? {
        workerRatingScore: rating,
        workerRatingComment: review || '',
      } : {
        customerRatingScore: rating,
        customerRatingComment: review || '',
      };

      const ratingRecord = await prisma.communityJob.update({
        where: { id: job.id },
        data: updateData,
      });

      res.status(201).json({ success: true, data: ratingRecord });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/community/my-jobs
   * Jobs posted and accepted by the user.
   */
  async myJobs(req, res, next) {
    try {
      const [posted, accepted] = await Promise.all([
        prisma.communityJob.findMany({
          where: { postedById: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { assignedTo: { select: { id: true, name: true } } },
        }),
        prisma.communityJob.findMany({
          where: { assignedToId: req.user.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { postedBy: { select: { id: true, name: true } } },
        }),
      ]);

      const convert = (j) => ({
        ...j,
        amount: Number(j.offeredPrice),
        escrowAmount: Number(j.escrowAmount || 0),
      });

      res.json({
        success: true,
        data: {
          posted: posted.map(convert),
          accepted: accepted.map(convert),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = communityController;
