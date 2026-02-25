// ============================================================
// Balance Handler — CHECK_BALANCE intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const { getTemplate } = require('../utils/templates');

const BalanceHandler = {
    async handle({ user, lang }) {
        try {
            const data = await GigPayAPI.getBalance(user.accessToken);
            return getTemplate(lang, 'balance', data);
        } catch (err) {
            return getTemplate(lang, 'error');
        }
    },
};

module.exports = BalanceHandler;
