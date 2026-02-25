// ============================================================
// Tax Handler — TAX_HELP intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const { getTemplate } = require('../utils/templates');
const logger = require('../utils/logger');

const TaxHandler = {
    async handle({ user, lang }) {
        try {
            const data = await GigPayAPI.getTaxSummary(user.accessToken);
            return getTemplate(lang, 'tax', data);
        } catch (err) {
            logger.error('Tax handler error:', err.message);
            return getTemplate(lang, 'error');
        }
    },
};

module.exports = TaxHandler;
