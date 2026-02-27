// ============================================================
// Message Handler — Central router for all incoming messages
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const SessionService = require('../services/session.service');
const { classifyIntent } = require('../nlp/intent_classifier');
const { getResponseLanguage } = require('../utils/language_detect');
const { getTemplate } = require('../utils/templates');
const logger = require('../utils/logger');

// Load all handlers
const BalanceHandler = require('./balance.handler');
const CashoutHandler = require('./cashout.handler');
const ForecastHandler = require('./forecast.handler');
const ZoneHandler = require('./zone.handler');
const LoanHandler = require('./loan.handler');

const TaxHandler = require('./tax.handler');
const ExpenseHandler = require('./expense.handler');
const CommunityHandler = require('./community.handler');

/**
 * Main handler called for every incoming WhatsApp message.
 * @param {object} params
 * @param {string} params.phone — sender's E.164 phone number
 * @param {string} params.message — raw message text
 * @param {string} [params.senderName] — display name from WhatsApp
 * @returns {Promise<string>} — reply text to send back
 */
async function handleMessage({ phone, message, senderName }) {
    const text = (message || '').trim();
    logger.info('Incoming message', { phone: phone.slice(-4), chars: text.length });

    // 1. Detect response language
    const lang = getResponseLanguage(text);

    // 2. Lookup user by phone
    let user = null;
    try {
        user = await GigPayAPI.getUserByPhone(phone);
    } catch (err) {
        logger.warn('User lookup failed', { phone: phone.slice(-4), error: err.message });
    }

    if (!user || !user.accessToken) {
        return getTemplate(lang, 'notRegistered');
    }

    // 3. Check for active multi-step session
    const session = await SessionService.get(phone);

    if (session?.intent === 'CASHOUT' && session?.step === 1) {
        // User is in cashout confirmation step → handle YES/NO
        return CashoutHandler.handleConfirmation({ user, session, message: text, lang, phone });
    }

    // 4. Classify intent
    const { intent, confidence, entities } = classifyIntent(text);

    logger.debug('Intent classified', { intent, confidence, entities });

    // 5. Route to appropriate handler
    const ctx = { user, entities, lang, phone, message: text };

    switch (intent) {
        case 'CHECK_BALANCE':
            return BalanceHandler.handle(ctx);

        case 'CASHOUT':
            return CashoutHandler.handle(ctx);

        case 'CHECK_EARNINGS_TODAY':
            return _handleEarningsToday(user, lang);

        case 'GET_FORECAST':
            return ForecastHandler.handle(ctx);

        case 'GET_HOT_ZONES':
            return ZoneHandler.handle(ctx);

        case 'APPLY_LOAN':
            return LoanHandler.handle(ctx);


        case 'TAX_HELP':
            return TaxHandler.handle(ctx);

        case 'EXPENSE_SUMMARY':
            return ExpenseHandler.handle(ctx);

        case 'COMMUNITY_JOBS':
            return CommunityHandler.handle(ctx);

        case 'HELP':
            // If first time, include welcome; otherwise just help menu
            const isFirstTime = !session;
            return isFirstTime
                ? getTemplate(lang, 'welcome', user.name || senderName)
                : getTemplate(lang, 'help');

        default:
            return getTemplate(lang, 'unknown');
    }
}

async function _handleEarningsToday(user, lang) {
    try {
        const data = await GigPayAPI.getTodayEarnings(user.accessToken);
        return getTemplate(lang, 'earningsToday', data);
    } catch {
        return getTemplate(lang, 'error');
    }
}

module.exports = { handleMessage };
