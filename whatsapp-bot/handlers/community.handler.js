// ============================================================
// Community Handler — COMMUNITY_JOBS intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const { getTemplate } = require('../utils/templates');
const logger = require('../utils/logger');

const CommunityHandler = {
    async handle({ user, lang }) {
        try {
            // Use Bangalore as default if no location on record
            const profile = await GigPayAPI.getProfile(user.accessToken).catch(() => null);
            const lat = profile?.homeLat || 12.9716;
            const lng = profile?.homeLng || 77.5946;

            const jobs = await GigPayAPI.getCommunityJobs(user.accessToken, lat, lng, 10);
            return getTemplate(lang, 'jobs', jobs);
        } catch (err) {
            logger.error('Community handler error:', err.message);
            return getTemplate(lang, 'error');
        }
    },
};

module.exports = CommunityHandler;
