// ============================================================
// Insurance Handler — ACTIVATE_INSURANCE intent
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const SessionService = require('../services/session.service');
const { getTemplate } = require('../utils/templates');
const logger = require('../utils/logger');

const PLAN_TYPE_MAP = {
    1: 'daily_accident',
    2: 'weekly_health',
    3: 'device',
    4: 'vehicle_breakdown',
};

const InsuranceHandler = {
    async handle({ user, entities, lang, phone, message }) {
        try {
            // If user says "INSURE 1" or "INSURE 2", activate that plan
            const insureMatch = message.match(/insure\s+(\d+)/i);
            if (insureMatch) {
                return InsuranceHandler._activatePlan(user, parseInt(insureMatch[1], 10), lang);
            }

            // Otherwise show available plans
            const plans = await GigPayAPI.getInsurancePlans(user.accessToken);
            return getTemplate(lang, 'insurance', plans);
        } catch (err) {
            logger.error('Insurance handler error:', err.message);
            return getTemplate(lang, 'error');
        }
    },

    async _activatePlan(user, planNumber, lang) {
        const planType = PLAN_TYPE_MAP[planNumber];
        if (!planType) {
            return lang === 'hi'
                ? `❌ Invalid plan number. 1–4 mein se choose karo.`
                : `❌ Invalid plan number. Choose between 1–4.`;
        }

        try {
            const policy = await GigPayAPI.activateInsurance(user.accessToken, planType, 1);
            return getTemplate(lang, 'insuranceActivated', policy);
        } catch (err) {
            const reason = err.response?.data?.error?.message || 'Insurance activation failed';
            return lang === 'hi'
                ? `❌ Insurance activate nahi hua: ${reason}`
                : `❌ Insurance activation failed: ${reason}`;
        }
    },
};

module.exports = InsuranceHandler;
