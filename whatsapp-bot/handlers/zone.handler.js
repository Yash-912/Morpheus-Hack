// ============================================================
// Zone Handler — GET_HOT_ZONES intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const { getTemplate } = require('../utils/templates');

const ZoneHandler = {
    async handle({ user, lang }) {
        try {
            // Get user profile to find their city
            const profile = await GigPayAPI.getProfile(user.accessToken);
            const city = profile?.city || 'bangalore';

            const zones = await GigPayAPI.getHotZones(user.accessToken, city);
            return getTemplate(lang, 'zones', zones);
        } catch (err) {
            return getTemplate(lang, 'error');
        }
    },
};

module.exports = ZoneHandler;
