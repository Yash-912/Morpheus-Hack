// ============================================================
// CommunityJob Model — Query helpers with geospatial support
// Usage: const CommunityJobModel = require('../models/CommunityJob');
// ============================================================

const { prisma } = require('../config/database');

const CommunityJobModel = {
    /**
     * Find nearby open jobs using lat/lng and a radius (km).
     * Uses Haversine approximation since PostGIS may not be available.
     * For production, replace with raw PostGIS ST_DWithin query.
     *
     * @param {number} lat - User latitude
     * @param {number} lng - User longitude
     * @param {number} radiusKm - Search radius in km (default 10)
     * @param {string} [type] - Optional job type filter
     * @param {number} [limit] - Max results (default 20)
     */
    async findNearby(lat, lng, radiusKm = 10, type = null, limit = 20) {
        const where = {
            status: 'open',
            pickupLat: { not: null },
            pickupLng: { not: null },
        };
        if (type) where.type = type;

        // Rough bounding box filter (approx 1 degree ≈ 111km)
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

        where.pickupLat = { gte: lat - latDelta, lte: lat + latDelta };
        where.pickupLng = { gte: lng - lngDelta, lte: lng + lngDelta };

        const jobs = await prisma.communityJob.findMany({
            where,
            include: {
                postedBy: { select: { id: true, name: true, gigScore: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit * 2, // Fetch extra, then filter by actual distance
        });

        // Calculate actual Haversine distance and filter
        const toRad = (deg) => (deg * Math.PI) / 180;
        const haversine = (lat1, lng1, lat2, lng2) => {
            const R = 6371; // Earth radius in km
            const dLat = toRad(lat2 - lat1);
            const dLng = toRad(lng2 - lng1);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const withDistance = jobs
            .map((job) => ({
                ...job,
                offeredPrice: Number(job.offeredPrice),
                escrowAmount: job.escrowAmount ? Number(job.escrowAmount) : null,
                distanceKm: haversine(lat, lng, job.pickupLat, job.pickupLng),
            }))
            .filter((job) => job.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, limit);

        return withDistance;
    },

    /**
     * Get jobs posted by and assigned to a specific user.
     */
    async getMyJobs(userId) {
        const [posted, accepted] = await Promise.all([
            prisma.communityJob.findMany({
                where: { postedById: userId },
                include: {
                    assignedTo: { select: { id: true, name: true, gigScore: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.communityJob.findMany({
                where: { assignedToId: userId },
                include: {
                    postedBy: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        const serialize = (jobs) =>
            jobs.map((j) => ({
                ...j,
                offeredPrice: Number(j.offeredPrice),
                escrowAmount: j.escrowAmount ? Number(j.escrowAmount) : null,
            }));

        return {
            posted: serialize(posted),
            accepted: serialize(accepted),
        };
    },

    /**
     * Get average rating for a worker (used in WorkerProfile).
     */
    async getWorkerRating(userId) {
        const jobs = await prisma.communityJob.findMany({
            where: {
                assignedToId: userId,
                status: 'completed',
                customerRatingScore: { not: null },
            },
            select: { customerRatingScore: true },
        });

        if (jobs.length === 0) return { avgRating: 0, totalRatings: 0 };

        const sum = jobs.reduce((acc, j) => acc + j.customerRatingScore, 0);
        return {
            avgRating: Math.round((sum / jobs.length) * 10) / 10,
            totalRatings: jobs.length,
        };
    },
};

module.exports = CommunityJobModel;
