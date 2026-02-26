// ============================================================
// Location Controller — GPS tracking data storage and retrieval
// ============================================================

const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

const locationController = {
    /**
     * POST /api/location/update
     * Save a GPS location point for the authenticated worker.
     */
    async update(req, res, next) {
        try {
            const userId = req.user.id;
            const { lat, lng, accuracy, speed, timestamp } = req.body;

            // Validate lat/lng ranges
            if (typeof lat !== 'number' || lat < -90 || lat > 90) {
                return res.status(400).json({ success: false, error: 'lat must be between -90 and 90' });
            }
            if (typeof lng !== 'number' || lng < -180 || lng > 180) {
                return res.status(400).json({ success: false, error: 'lng must be between -180 and 180' });
            }

            await prisma.workerLocation.create({
                data: {
                    userId,
                    lat,
                    lng,
                    accuracy: accuracy || null,
                    speed: speed || null,
                    timestamp: timestamp ? new Date(timestamp) : new Date(),
                },
            });

            logger.debug('Location saved', { userId, lat, lng });
            res.json({ success: true });
        } catch (error) {
            logger.error('Location update failed:', error.message);
            next(error);
        }
    },

    /**
     * GET /api/location/recent/:userId
     * Returns last 50 location points for a given user.
     * Used by the zone clustering ML service.
     */
    async recent(req, res, next) {
        try {
            const { userId } = req.params;

            const locations = await prisma.workerLocation.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                take: 50,
                select: {
                    lat: true,
                    lng: true,
                    accuracy: true,
                    speed: true,
                    timestamp: true,
                },
            });

            res.json({ success: true, locations });
        } catch (error) {
            logger.error('Location recent fetch failed:', error.message);
            next(error);
        }
    },
};

module.exports = locationController;
