// ============================================================
// Aadhaar Service — UIDAI eKYC OTP request & verification
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger.utils');
const { encrypt } = require('../utils/crypto.utils');

const UIDAI_API_URL = process.env.UIDAI_API_URL || 'https://developer.uidai.gov.in';
const AUA_CODE = process.env.UIDAI_AUA_CODE;
const LICENSE_KEY = process.env.UIDAI_LICENSE_KEY;

const client = axios.create({
  baseURL: UIDAI_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const AadhaarService = {
  /**
   * Request OTP to the Aadhaar-linked mobile number.
   * @param {string} aadhaarNumber — 12-digit Aadhaar
   * @returns {Promise<{txnId: string}>}
   */
  async requestOtp(aadhaarNumber) {
    try {
      logger.info('Aadhaar OTP requested', { aadhaar: aadhaarNumber.slice(-4) });

      const { data } = await client.post('/otp', {
        uid: aadhaarNumber,
        auaCode: AUA_CODE,
        licenseKey: LICENSE_KEY,
      });

      if (!data.txnId) {
        throw new Error('UIDAI did not return a transaction ID');
      }

      return { txnId: data.txnId };
    } catch (error) {
      logger.error('Aadhaar OTP request failed:', error.message);

      if (error.response?.status === 400) {
        const err = new Error('Invalid Aadhaar number or UIDAI service error');
        err.statusCode = 400;
        throw err;
      }

      const err = new Error('Aadhaar verification service temporarily unavailable');
      err.statusCode = 503;
      throw err;
    }
  },

  /**
   * Verify the OTP and extract KYC data.
   * @param {string} aadhaarNumber — 12-digit Aadhaar
   * @param {string} otp — 6-digit OTP from UIDAI
   * @param {string} txnId — transaction ID from requestOtp
   * @returns {Promise<{name, dob, address, photo_base64, verified}>}
   */
  async verifyOtp(aadhaarNumber, otp, txnId) {
    try {
      logger.info('Aadhaar OTP verification', { aadhaar: aadhaarNumber.slice(-4), txnId });

      const { data } = await client.post('/kyc', {
        uid: aadhaarNumber,
        otp,
        txnId,
        auaCode: AUA_CODE,
        licenseKey: LICENSE_KEY,
      });

      if (!data.verified) {
        const err = new Error('Aadhaar OTP verification failed');
        err.statusCode = 400;
        throw err;
      }

      return {
        name: data.name,
        dob: data.dob,
        address: data.address,
        photo_base64: data.photo || null,
        verified: true,
        // Store encrypted Aadhaar for compliance
        encryptedAadhaar: encrypt(aadhaarNumber),
      };
    } catch (error) {
      if (error.statusCode) throw error;

      logger.error('Aadhaar OTP verification failed:', error.message);

      if (error.response?.status === 400) {
        const err = new Error('Invalid OTP or expired session');
        err.statusCode = 400;
        throw err;
      }

      const err = new Error('Aadhaar verification service temporarily unavailable');
      err.statusCode = 503;
      throw err;
    }
  },
};

module.exports = AadhaarService;
