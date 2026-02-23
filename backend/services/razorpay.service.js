// ============================================================
// Razorpay Service — Fund accounts, payouts, webhook verification
// ============================================================

const crypto = require('crypto');
const { razorpayClient } = require('../config/razorpay');
const logger = require('../utils/logger.utils');

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER;

const RazorpayService = {
  /**
   * Create or retrieve a Razorpay fund account for a user's bank details.
   * @param {string} contactId — Razorpay contact ID (created beforehand or inline)
   * @param {object} bankDetails — { accountNumber, ifscCode, holderName }
   * @returns {Promise<string>} fund_account_id
   */
  async createFundAccount(contactId, bankDetails) {
    if (!razorpayClient) {
      throw Object.assign(new Error('Payment service unavailable'), { statusCode: 503 });
    }

    try {
      const fundAccount = await razorpayClient.fundAccount.create({
        contact_id: contactId,
        account_type: 'bank_account',
        bank_account: {
          name: bankDetails.holderName,
          ifsc: bankDetails.ifscCode,
          account_number: bankDetails.accountNumber,
        },
      });

      logger.info('Fund account created', { fundAccountId: fundAccount.id });
      return fundAccount.id;
    } catch (error) {
      logger.error('Fund account creation failed:', error);
      throw Object.assign(new Error('Failed to create fund account'), { statusCode: 502 });
    }
  },

  /**
   * Create a Razorpay contact (required before fund accounts).
   * @param {object} user — { name, phone, email? }
   * @returns {Promise<string>} contact_id
   */
  async createContact(user) {
    if (!razorpayClient) {
      throw Object.assign(new Error('Payment service unavailable'), { statusCode: 503 });
    }

    try {
      const contact = await razorpayClient.contacts?.create({
        name: user.name || 'GigPay User',
        contact: user.phone,
        email: user.email || undefined,
        type: 'employee',
      });

      // Fallback for older Razorpay SDK versions
      if (!contact?.id) {
        const axios = require('axios');
        const { data } = await axios.post(
          'https://api.razorpay.com/v1/contacts',
          {
            name: user.name || 'GigPay User',
            contact: user.phone,
            type: 'employee',
          },
          {
            auth: {
              username: process.env.RAZORPAY_KEY_ID,
              password: process.env.RAZORPAY_KEY_SECRET,
            },
          }
        );
        return data.id;
      }

      return contact.id;
    } catch (error) {
      logger.error('Contact creation failed:', error);
      throw Object.assign(new Error('Failed to create payment contact'), { statusCode: 502 });
    }
  },

  /**
   * Initiate a payout via Razorpay.
   * @param {object} payoutData — { fundAccountId, amount (paise), currency, mode, purpose, referenceId }
   * @returns {Promise<{razorpayPayoutId: string, status: string}>}
   */
  async initiatePayout(payoutData) {
    if (!razorpayClient) {
      throw Object.assign(new Error('Payment service unavailable'), { statusCode: 503 });
    }

    try {
      const payout = await razorpayClient.payouts?.create({
        account_number: ACCOUNT_NUMBER,
        fund_account_id: payoutData.fundAccountId,
        amount: payoutData.amount,
        currency: payoutData.currency || 'INR',
        mode: payoutData.mode || 'IMPS',
        purpose: payoutData.purpose || 'payout',
        queue_if_low_balance: true,
        reference_id: payoutData.referenceId,
      });

      // Fallback for SDK compatibility
      if (!payout?.id) {
        const axios = require('axios');
        const { data } = await axios.post(
          'https://api.razorpay.com/v1/payouts',
          {
            account_number: ACCOUNT_NUMBER,
            fund_account_id: payoutData.fundAccountId,
            amount: payoutData.amount,
            currency: payoutData.currency || 'INR',
            mode: payoutData.mode || 'IMPS',
            purpose: payoutData.purpose || 'payout',
            queue_if_low_balance: true,
            reference_id: payoutData.referenceId,
          },
          {
            auth: {
              username: process.env.RAZORPAY_KEY_ID,
              password: process.env.RAZORPAY_KEY_SECRET,
            },
          }
        );
        return { razorpayPayoutId: data.id, status: data.status };
      }

      logger.info('Payout initiated', {
        razorpayPayoutId: payout.id,
        amount: payoutData.amount,
      });

      return { razorpayPayoutId: payout.id, status: payout.status };
    } catch (error) {
      logger.error('Payout initiation failed:', error);
      throw Object.assign(new Error('Payout initiation failed'), { statusCode: 502 });
    }
  },

  /**
   * Get live status of a payout.
   * @param {string} payoutId — Razorpay payout ID
   * @returns {Promise<{status: string, statusDetails: string}>}
   */
  async getPayoutStatus(payoutId) {
    if (!razorpayClient) {
      throw Object.assign(new Error('Payment service unavailable'), { statusCode: 503 });
    }

    try {
      const axios = require('axios');
      const { data } = await axios.get(
        `https://api.razorpay.com/v1/payouts/${payoutId}`,
        {
          auth: {
            username: process.env.RAZORPAY_KEY_ID,
            password: process.env.RAZORPAY_KEY_SECRET,
          },
        }
      );

      return { status: data.status, statusDetails: data.status_details?.description };
    } catch (error) {
      logger.error('Payout status check failed:', error);
      throw Object.assign(new Error('Failed to check payout status'), { statusCode: 502 });
    }
  },

  /**
   * Verify Razorpay webhook signature (HMAC SHA256).
   * @param {string|Buffer} body — raw request body
   * @param {string} signature — X-Razorpay-Signature header value
   * @returns {boolean}
   */
  verifyWebhookSignature(body, signature) {
    if (!WEBHOOK_SECRET) {
      logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  },
};

module.exports = RazorpayService;
