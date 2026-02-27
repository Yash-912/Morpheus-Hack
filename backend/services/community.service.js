// ============================================================
// Community Service — PostGIS marketplace, escrow, disputes
// ============================================================

const logger = require('../utils/logger.utils');
const { prisma } = require('../config/database');
const { COMMUNITY_PLATFORM_FEE } = require('../config/constants');
const { paiseToRupees } = require('../utils/formatters.utils');

const CommunityService = {
  /**
   * Find nearby jobs using PostGIS ST_DWithin.
   * @param {number} lat
   * @param {number} lng
   * @param {number} [radiusKm=5] — search radius in kilometres
   * @param {string} [type] — optional job type filter
   * @returns {Promise<Array>} nearby jobs
   */
  async findNearbyJobs(lat, lng, radiusKm = 5, type = null) {
    const radiusMeters = radiusKm * 1000;

    const typeFilter = type ? `AND cj."type" = '${type}'` : '';

    const jobs = await prisma.$queryRawUnsafe(
      `
      SELECT
        cj.*,
        u."name" AS poster_name,
        u."phone" AS poster_phone,
        ST_Distance(
          cj."location"::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_meters
      FROM "community_jobs" cj
      JOIN "users" u ON u."id" = cj."posted_by"
      WHERE cj."status" = 'open'
        AND ST_DWithin(
          cj."location"::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        ${typeFilter}
      ORDER BY distance_meters ASC
      LIMIT 50
      `,
      lng,
      lat,
      radiusMeters
    );

    logger.debug('Nearby jobs found', { count: jobs.length, radiusKm, lat, lng });
    return jobs;
  },

  /**
   * Create a community job with escrow from customer's wallet.
   * @param {string} userId — poster's ID
   * @param {{ title: string, description: string, type: string, budget: number, lat: number, lng: number }} jobData
   *   budget in paise
   * @returns {Promise<Object>} created CommunityJob
   */
  async createJob(userId, jobData) {
    const { title, description, type, budget, lat, lng } = jobData;

    if (budget < 5000) {
      // ₹50 minimum
      const error = new Error('Minimum job budget is ₹50');
      error.statusCode = 400;
      throw error;
    }

    // Escrow: deduct from poster's wallet via transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check wallet balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!user || Number(user.walletBalance) < budget) {
        const error = new Error(
          `Insufficient wallet balance. Required: ₹${paiseToRupees(budget)}, Available: ₹${paiseToRupees(Number(user?.walletBalance || 0))}`
        );
        error.statusCode = 400;
        throw error;
      }

      // Deduct from wallet (escrow)
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: BigInt(budget) } },
      });

      // Create job with PostGIS point
      const job = await tx.$queryRawUnsafe(
        `
        INSERT INTO "community_jobs" (
          "id", "posted_by", "title", "description", "type",
          "offered_price", "status", "location", "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4,
          $5, 'open',
          ST_SetSRID(ST_MakePoint($6, $7), 4326),
          NOW(), NOW()
        )
        RETURNING *
        `,
        userId,
        title,
        description,
        type,
        BigInt(budget),
        lng,
        lat
      );

      return job[0];
    });

    logger.info('Community job created with escrow', {
      jobId: result.id,
      userId,
      budget: paiseToRupees(budget),
    });

    return result;
  },

  /**
   * Accept a job — assigns worker, changes status.
   * @param {string} jobId
   * @param {string} workerId
   * @returns {Promise<Object>} updated job
   */
  async acceptJob(jobId, workerId) {
    const job = await prisma.communityJob.findUnique({ where: { id: jobId } });

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.status !== 'open') {
      const error = new Error('Job is no longer available');
      error.statusCode = 400;
      throw error;
    }

    if (job.postedById === workerId) {
      const error = new Error('Cannot accept your own job');
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.communityJob.update({
      where: { id: jobId },
      data: {
        assignedToId: workerId,
        status: 'assigned',
      },
    });

    logger.info('Job accepted', { jobId, workerId });
    return updated;
  },

  /**
   * Confirm job completion — release escrow to worker minus platform fee.
   * Only the job poster (customer) can confirm.
   * @param {string} jobId
   * @param {string} customerId — must be the poster
   * @returns {Promise<{ workerPayout: number, platformFee: number }>}
   */
  async confirmCompletion(jobId, customerId) {
    const job = await prisma.communityJob.findUnique({ where: { id: jobId } });

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.postedById !== customerId) {
      const error = new Error('Only the job poster can confirm completion');
      error.statusCode = 403;
      throw error;
    }

    if (job.status !== 'assigned') {
      const error = new Error('Job must be in assigned status to confirm');
      error.statusCode = 400;
      throw error;
    }

    const escrow = Number(job.offeredPrice);
    const platformFee = Math.round(escrow * COMMUNITY_PLATFORM_FEE);
    const workerPayout = escrow - platformFee;

    // Release escrow to worker via transaction
    await prisma.$transaction(async (tx) => {
      // Credit worker wallet
      await tx.user.update({
        where: { id: job.assignedToId },
        data: { walletBalance: { increment: BigInt(workerPayout) } },
      });

      // Update job status
      await tx.communityJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
        },
      });
    });

    logger.info('Job completed, escrow released', {
      jobId,
      workerPayout: paiseToRupees(workerPayout),
      platformFee: paiseToRupees(platformFee),
    });

    return { workerPayout, platformFee };
  },

  /**
   * Flag a job for dispute — holds escrow, marks for review.
   * @param {string} jobId
   * @param {string} reporterId — user filing the dispute
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  async handleDispute(jobId, reporterId, reason) {
    const job = await prisma.communityJob.findUnique({ where: { id: jobId } });

    if (!job) {
      const error = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.postedById !== reporterId && job.assignedToId !== reporterId) {
      const error = new Error('Only parties involved in the job can file a dispute');
      error.statusCode = 403;
      throw error;
    }

    const updated = await prisma.communityJob.update({
      where: { id: jobId },
      data: {
        status: 'disputed',
        disputeReason: reason,
        disputedBy: reporterId,
      },
    });

    logger.warn('Job disputed', {
      jobId,
      reporterId,
      reason,
      escrowHeld: paiseToRupees(Number(job.escrowAmount)),
    });

    return updated;
  },
};

module.exports = CommunityService;
