// ============================================================
// Cashout Handler — Multi-step CASHOUT intent
// Steps: 1 → show fee preview + confirm  2 → biometric link  3 → done
// ============================================================

const GigPayAPI = require('../services/gigpay_api.service');
const SessionService = require('../services/session.service');
const { getTemplate, paiseToRupees } = require('../utils/templates');
const { extractAmount } = require('../nlp/entity_extractor');
const logger = require('../utils/logger');

const FRONTEND_URL = process.env.GIGPAY_FRONTEND_URL || 'https://gigpay.in';

const CashoutHandler = {
    /**
     * Entry point — called when a fresh CASHOUT intent is detected.
     * entities.amount is in paise.
     */
    async handle({ user, entities, lang, phone }) {
        const amount = entities.amount;

        if (!amount) {
            return (
                lang === 'hi'
                    ? `💸 Kitna nikalna hai? Reply karo: *CASHOUT {amount}*\nExample: CASHOUT 500`
                    : `💸 How much do you want to cashout?\nReply: *CASHOUT {amount}*\nExample: CASHOUT 500`
            );
        }

        return CashoutHandler._step1(user, amount, lang, phone);
    },

    async _step1(user, amount, lang, phone) {
        try {
            // Get balance check
            const balance = await GigPayAPI.getBalance(user.accessToken);
            if (amount > balance.walletBalance) {
                return lang === 'hi'
                    ? `❌ Insufficient balance. Aapke wallet mein sirf ₹${paiseToRupees(balance.walletBalance)} hai.`
                    : `❌ Insufficient balance. Your wallet has only ₹${paiseToRupees(balance.walletBalance)}.`;
            }

            // Get fee preview
            const fee = await GigPayAPI.getFeePreview(user.accessToken, amount, 'standard');

            // Save session
            await SessionService.set(phone, {
                intent: 'CASHOUT',
                step: 1,
                lang,
                data: {
                    amount,
                    fee: fee.totalFee,
                    netAmount: fee.netAmount,
                    upiId: user.primaryUpiId || 'your registered UPI',
                },
            });

            return getTemplate(lang, 'cashoutStep1', amount, fee.totalFee, fee.netAmount, user.primaryUpiId);
        } catch (err) {
            logger.error('Cashout step1 error:', err.message);
            return getTemplate(lang, 'error');
        }
    },

    /**
     * Called when user replies YES/NO in the confirmation step.
     */
    async handleConfirmation({ user, session, message, lang, phone }) {
        const normalized = message.trim().toUpperCase();
        const isYes = /^(YES|Y|HA|HAAN|CONFIRM|OK)$/i.test(normalized);
        const isNo = /^(NO|N|NAHI|NOPE|CANCEL)$/i.test(normalized);

        if (isNo) {
            await SessionService.clear(phone);
            return lang === 'hi' ? `✅ Cashout cancel ho gaya.` : `✅ Cashout cancelled.`;
        }

        if (!isYes) {
            return lang === 'hi'
                ? `Kripya *YES* ya *NO* likho.`
                : `Please reply *YES* to confirm or *NO* to cancel.`;
        }

        // Generate a one-time deep-link for biometric in the PWA
        const token = require('crypto').randomBytes(16).toString('hex');
        const deepLink = `${FRONTEND_URL}/biometric-auth?token=${token}&amount=${session.data.amount}&intent=cashout`;

        // Store pending cashout in session
        await SessionService.update(phone, {
            step: 2,
            data: { ...session.data, deepLinkToken: token },
        });

        return getTemplate(lang, 'cashoutVerifyLink', deepLink);
    },

    /**
     * Called after biometric verification completes (via callback from PWA).
     * This is triggered when the backend calls bot-complete-cashout API.
     */
    async completeAfterBiometric({ user, session, withdrawalToken, lang, phone }) {
        try {
            const { amount } = session.data;
            const result = await GigPayAPI.initiatePayout(user.accessToken, amount, withdrawalToken);

            await SessionService.clear(phone);
            return getTemplate(lang, 'cashoutSuccess', result.netAmount);
        } catch (err) {
            await SessionService.clear(phone);
            const reason = err.response?.data?.error?.message || 'Payout failed';
            return getTemplate(lang, 'cashoutFailed', reason);
        }
    },
};

module.exports = CashoutHandler;
