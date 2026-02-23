// ============================================================
// CommunityJob Model Helper — Geospatial queries, escrow, ratings
// ============================================================

const prisma = require('../config/database');

const CommunityJobHelper = {
  // -----------------------------------------------------------
  // Find nearby jobs using PostGIS ST_DWithin
  // radius in km, type is optional filter
  // -----------------------------------------------------------
  async findNearbyJobs(lat, lng, radiusKm = 10, type = null) {
    const radiusMeters = radiusKm * 1000;

    // Use raw SQL for PostGIS geospatial query
    const typeFilter = type ? `AND type = '${type}'` : '';

    const jobs = await prisma.$queryRawUnsafe(`
      SELECT *,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(geo_lng, geo_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_meters
      FROM community_jobs
      WHERE status = 'open'
        AND geo_lat IS NOT NULL
        AND geo_lng IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(geo_lng, geo_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        ${typeFilter}
      ORDER BY distance_meters ASC
      LIMIT 50
    `, lng, lat, radiusMeters);

    return jobs.map(CommunityJobHelper.serialize);
  },

  // -----------------------------------------------------------
  // Get jobs posted by or assigned to a user
  // -----------------------------------------------------------
  async getUserJobs(userId, role = 'both') {
    const where = {};
    if (role === 'poster') {
      where.postedById = userId;
    } else if (role === 'worker') {
      where.assignedToId = userId;
    } else {
      where.OR = [{ postedById: userId }, { assignedToId: userId }];
    }

    return prisma.communityJob.findMany({
      where,
      include: {
        postedBy: { select: { id: true, name: true, phone: true, gigScore: true } },
        assignedTo: { select: { id: true, name: true, phone: true, gigScore: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // -----------------------------------------------------------
  // Create a job with escrow from customer's wallet
  // -----------------------------------------------------------
  async createWithEscrow(userId, jobData) {
    return prisma.$transaction(async (tx) => {
      const escrowAmount = BigInt(jobData.offeredPrice);

      // Deduct from customer wallet (lock the amount)
      const updated = await tx.$executeRaw`
        UPDATE users
        SET wallet_balance = wallet_balance - ${escrowAmount}::bigint,
            wallet_locked_balance = wallet_locked_balance + ${escrowAmount}::bigint,
            updated_at = NOW()
        WHERE id = ${userId}::uuid
          AND wallet_balance >= ${escrowAmount}::bigint
      `;

      if (updated === 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Create the job
      const job = await tx.communityJob.create({
        data: {
          postedById: userId,
          type: jobData.type,
          title: jobData.title,
          description: jobData.description,
          pickupAddress: jobData.pickupAddress,
          pickupLat: jobData.pickupLat,
          pickupLng: jobData.pickupLng,
          dropoffAddress: jobData.dropoffAddress,
          dropoffLat: jobData.dropoffLat,
          dropoffLng: jobData.dropoffLng,
          offeredPrice: escrowAmount,
          escrowAmount,
          paymentStatus: 'escrowed',
          city: jobData.city,
          geoLat: jobData.pickupLat,
          geoLng: jobData.pickupLng,
          expiresAt: jobData.expiresAt,
        },
      });

      return job;
    });
  },

  // -----------------------------------------------------------
  // Accept a job (assign worker)
  // -----------------------------------------------------------
  async acceptJob(jobId, workerId) {
    return prisma.communityJob.update({
      where: { id: jobId, status: 'open' },
      data: {
        assignedToId: workerId,
        status: 'assigned',
      },
    });
  },

  // -----------------------------------------------------------
  // Confirm completion & release escrow (minus 5% platform fee)
  // -----------------------------------------------------------
  async confirmAndRelease(jobId, customerId) {
    return prisma.$transaction(async (tx) => {
      const job = await tx.communityJob.findUnique({
        where: { id: jobId },
      });

      if (!job || job.postedById !== customerId) {
        throw new Error('UNAUTHORIZED');
      }
      if (job.status !== 'in_progress') {
        throw new Error('INVALID_STATUS');
      }

      const escrow = Number(job.escrowAmount);
      const fee = Math.round(escrow * job.platformFee);
      const workerPayout = escrow - fee;

      // Release locked balance from customer
      await tx.$executeRaw`
        UPDATE users
        SET wallet_locked_balance = wallet_locked_balance - ${BigInt(escrow)}::bigint,
            updated_at = NOW()
        WHERE id = ${customerId}::uuid
      `;

      // Credit worker wallet
      await tx.$executeRaw`
        UPDATE users
        SET wallet_balance = wallet_balance + ${BigInt(workerPayout)}::bigint,
            wallet_lifetime_earned = wallet_lifetime_earned + ${BigInt(workerPayout)}::bigint,
            updated_at = NOW()
        WHERE id = ${job.assignedToId}::uuid
      `;

      // Update job status
      const updatedJob = await tx.communityJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          paymentStatus: 'released',
        },
      });

      return { job: updatedJob, workerPayout, platformFee: fee };
    });
  },

  // -----------------------------------------------------------
  // Submit rating
  // -----------------------------------------------------------
  async submitRating(jobId, raterUserId, score, comment) {
    const job = await prisma.communityJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('JOB_NOT_FOUND');

    const data = {};
    if (raterUserId === job.postedById) {
      // Customer rating the worker
      data.workerRatingScore = score;
      data.workerRatingComment = comment;
    } else if (raterUserId === job.assignedToId) {
      // Worker rating the customer
      data.customerRatingScore = score;
      data.customerRatingComment = comment;
    } else {
      throw new Error('UNAUTHORIZED');
    }

    return prisma.communityJob.update({
      where: { id: jobId },
      data,
    });
  },

  // -----------------------------------------------------------
  // Serialize for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(job) {
    if (!job) return null;
    return {
      ...job,
      offeredPrice: Number(job.offeredPrice || job.offered_price || 0),
      escrowAmount: job.escrowAmount != null ? Number(job.escrowAmount) : (job.escrow_amount != null ? Number(job.escrow_amount) : null),
      distanceMeters: job.distance_meters != null ? Number(job.distance_meters) : undefined,
    };
  },
};

module.exports = CommunityJobHelper;
