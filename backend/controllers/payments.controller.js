// ============================================================
// Payments Controller
// ============================================================
const StripeService = require('../services/stripe.service');
const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

const paymentsController = {
    async createPaymentIntent(req, res, next) {
        try {
            const { amount, jobId } = req.body; // amount in INR

            if (!amount || amount <= 0) {
                return res.status(400).json({ status: 'error', message: 'Invalid amount' });
            }

            // Convert INR to Paise
            const amountPaise = amount * 100;

            // We can add metadata to track which job or user this payment is for
            const metadata = {
                jobId: jobId || 'general_payment',
                payerId: req.user.id
            };

            const { clientSecret, paymentIntentId } = await StripeService.createPaymentIntent(amountPaise, metadata);

            res.status(200).json({
                status: 'success',
                data: {
                    clientSecret,
                    paymentIntentId
                }
            });

        } catch (error) {
            next(error);
        }
    }
};

module.exports = paymentsController;
