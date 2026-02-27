// ============================================================
// SMS Service — Twilio OTP sending & verification
// ============================================================

const twilio = require('twilio');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger.utils');
const { redisClient } = require('../config/redis');
const {
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RATE_LIMIT_WINDOW_MINUTES,
  OTP_RATE_LIMIT_MAX,
} = require('../config/constants');

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SMS_FROM = process.env.TWILIO_SMS_NUMBER;

let twilioClient = null;
if (TWILIO_SID && TWILIO_TOKEN) {
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
}

const SMS_RATE_KEY = (phone) => `sms_rate:${phone}`;
const OTP_STORE_KEY = (phone) => `otp_store:${phone}`;

const SmsService = {
  /**
   * Generate and send OTP via Twilio SMS.
   * @param {string} phone — E.164 format (+91XXXXXXXXXX)
   * @returns {Promise<{sent: boolean, otpHash: string}>}
   */
  async sendOtp(phone) {
    // ---- Rate limit check ----
    const rateKey = SMS_RATE_KEY(phone);
    const count = await redisClient.incr(rateKey);
    if (count === 1) {
      await redisClient.expire(rateKey, OTP_RATE_LIMIT_WINDOW_MINUTES * 60);
    }
    if (count > OTP_RATE_LIMIT_MAX) {
      const error = new Error('OTP rate limit exceeded. Try again later.');
      error.statusCode = 429;
      throw error;
    }

    // ---- Generate 6-digit OTP ----
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    // ---- Store hash + attempts in Redis ----
    await redisClient
      .multi()
      .hset(OTP_STORE_KEY(phone), 'hash', otpHash, 'attempts', '0')
      .expire(OTP_STORE_KEY(phone), OTP_EXPIRY_MINUTES * 60)
      .exec();

    // ---- Dev bypass: skip Twilio entirely, return OTP in response ----
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      logger.warn('DEV MODE — OTP bypass active, SMS not sent', { otp, phone: phone.slice(-4) });
      return { sent: true, otpHash, devOtp: otp };
    }

    // ---- Send via Twilio (production only) ----
    if (!twilioClient || !TWILIO_SMS_FROM) {
      logger.warn('Twilio not configured — OTP logged for dev', { otp, phone: phone.slice(-4) });
      return { sent: true, otpHash, devOtp: otp };
    }

    try {
      await twilioClient.messages.create({
        body: `Your GigPay verification code is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
        from: TWILIO_SMS_FROM,
        to: phone,
      });

      logger.info('OTP SMS sent', { phone: phone.slice(-4) });
      return { sent: true, otpHash };
    } catch (error) {
      logger.error('Twilio SMS send failed:', error.message);
      const err = new Error('Failed to send OTP');
      err.statusCode = 503;
      throw err;
    }
  },

  /**
   * Verify OTP against stored hash.
   * @param {string} phone — E.164 format
   * @param {string} otp — 6-digit code supplied by user
   * @returns {Promise<boolean>}
   */
  async verifyOtp(phone, otp) {
    const storeKey = OTP_STORE_KEY(phone);
    const stored = await redisClient.hgetall(storeKey);

    if (!stored || !stored.hash) {
      const error = new Error('OTP expired or not found');
      error.statusCode = 400;
      throw error;
    }

    const attempts = parseInt(stored.attempts, 10) || 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redisClient.del(storeKey);
      const error = new Error('Too many failed attempts. Request a new OTP.');
      error.statusCode = 429;
      throw error;
    }

    const match = await bcrypt.compare(otp, stored.hash);

    if (!match) {
      await redisClient.hincrby(storeKey, 'attempts', 1);
      return false;
    }

    // Verified — cleanup
    await redisClient.del(storeKey);
    logger.info('OTP verified', { phone: phone.slice(-4) });
    return true;
  },
};

module.exports = SmsService;
