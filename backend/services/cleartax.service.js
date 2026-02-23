// ============================================================
// ClearTax Service — ITR filing integration
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger.utils');
const TaxService = require('./tax.service');

const CLEARTAX_API_URL = process.env.CLEARTAX_API_URL || 'https://api.cleartax.in/v2';
const CLEARTAX_API_KEY = process.env.CLEARTAX_API_KEY;

const client = axios.create({
  baseURL: CLEARTAX_API_URL,
  timeout: 30000,
  headers: {
    'X-API-Key': CLEARTAX_API_KEY,
    'Content-Type': 'application/json',
  },
});

const ClearTaxService = {
  /**
   * Pre-fill ITR data for a user from GigPay earnings/expenses.
   * @param {string} userId
   * @param {string} fy — e.g. "2024-2025"
   * @returns {Promise<Object>} pre-filled ITR data payload
   */
  async prefillITR(userId, fy) {
    if (!CLEARTAX_API_KEY) {
      logger.warn('ClearTax API key not configured');
      const error = new Error('Tax filing service is not configured');
      error.statusCode = 503;
      throw error;
    }

    try {
      // Calculate tax data from our engine
      const taxData = await TaxService.calculateTaxLiability(userId, fy);

      const payload = {
        financial_year: fy,
        assessment_year: `${parseInt(fy.split('-')[1], 10)}-${parseInt(fy.split('-')[1], 10) + 1}`,
        itr_form: 'ITR-4', // Presumptive taxation form for small businesses
        gross_income: taxData.grossIncome,
        business_income: taxData.usePresumptive ? taxData.presumptiveProfit : taxData.actualProfit,
        business_type: 'freelance_gig',
        section_44ad_applicable: taxData.usePresumptive,
        total_expenses: taxData.totalExpenses,
        tax_regime: taxData.recommendedRegime,
      };

      const response = await client.post('/itr/prefill', {
        user_id: userId,
        ...payload,
      });

      logger.info('ClearTax ITR pre-filled', { userId, fy });
      return response.data;
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('ClearTax prefill failed:', error.message);
      const err = new Error('Failed to pre-fill tax return');
      err.statusCode = error.response?.status || 500;
      throw err;
    }
  },

  /**
   * Submit ITR via ClearTax.
   * @param {string} userId
   * @param {string} fy
   * @returns {Promise<{ returnId: string, status: string, ackNumber: string }>}
   */
  async submitReturn(userId, fy) {
    if (!CLEARTAX_API_KEY) {
      const error = new Error('Tax filing service is not configured');
      error.statusCode = 503;
      throw error;
    }

    try {
      const response = await client.post('/itr/submit', {
        user_id: userId,
        financial_year: fy,
      });

      const { return_id, status, acknowledgement_number } = response.data;

      logger.info('ClearTax ITR submitted', {
        userId,
        fy,
        returnId: return_id,
      });

      return {
        returnId: return_id,
        status,
        ackNumber: acknowledgement_number,
      };
    } catch (error) {
      logger.error('ClearTax submit failed:', error.message);
      const err = new Error('Failed to submit tax return');
      err.statusCode = error.response?.status || 500;
      throw err;
    }
  },

  /**
   * Check filing status of a submitted return.
   * @param {string} returnId
   * @returns {Promise<{ status: string, ackNumber: string|null, eVerified: boolean }>}
   */
  async getFilingStatus(returnId) {
    if (!CLEARTAX_API_KEY) {
      const error = new Error('Tax filing service is not configured');
      error.statusCode = 503;
      throw error;
    }

    try {
      const response = await client.get(`/itr/status/${returnId}`);

      return {
        status: response.data.status,
        ackNumber: response.data.acknowledgement_number || null,
        eVerified: response.data.e_verified || false,
      };
    } catch (error) {
      logger.error('ClearTax status check failed:', error.message);
      const err = new Error('Failed to check filing status');
      err.statusCode = error.response?.status || 500;
      throw err;
    }
  },
};

module.exports = ClearTaxService;
