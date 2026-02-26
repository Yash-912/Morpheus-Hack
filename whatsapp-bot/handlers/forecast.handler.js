// ============================================================
// Forecast Handler — GET_FORECAST intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const { getTemplate } = require('../utils/templates');

const ForecastHandler = {
    async handle({ user, lang }) {
        try {
            const data = await GigPayAPI.getForecast(user.accessToken);
            return getTemplate(lang, 'forecast', data);
        } catch (err) {
            return getTemplate(lang, 'error');
        }
    },
};

module.exports = ForecastHandler;
