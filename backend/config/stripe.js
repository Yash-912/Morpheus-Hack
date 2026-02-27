// ============================================================
// Stripe Configuration
// ============================================================

const Stripe = require('stripe');
const logger = require('../utils/logger.utils');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

let _stripeClient = null;

function _init() {
    if (_stripeClient) return;

    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.includes('mock_')) {
        logger.warn('Stripe secret key missing or mocked. Stripe features will be disabled.');
        return;
    }

    try {
        _stripeClient = new Stripe(STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16', // or latest
        });
        logger.info('Stripe client initialized');
    } catch (error) {
        logger.error('Failed to initialize Stripe client:', error);
    }
}

module.exports = {
    get stripeClient() { _init(); return _stripeClient; },
};
