// ============================================================
// Insurance Service — Acko / InsuranceDekho integration
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger.utils');

const INSURANCE_API_URL = process.env.INSURANCE_API_URL || 'https://api.acko.com/v1';
const INSURANCE_API_KEY = process.env.INSURANCE_API_KEY;

const client = axios.create({
  baseURL: INSURANCE_API_URL,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${INSURANCE_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Plan definitions for gig workers
const GIG_INSURANCE_TYPES = {
  accident: { label: 'Personal Accident Cover', minDuration: 30, maxDuration: 365 },
  health: { label: 'Health Insurance', minDuration: 365, maxDuration: 365 },
  vehicle: { label: 'Vehicle Insurance', minDuration: 365, maxDuration: 365 },
  income_protection: { label: 'Income Protection', minDuration: 30, maxDuration: 365 },
};

const InsuranceService = {
  /**
   * Get available insurance plans based on user profile.
   * @param {{ age: number, city: string, platforms: string[] }} userProfile
   * @returns {Promise<Array>} available plans with pricing
   */
  async getAvailablePlans(userProfile) {
    if (!INSURANCE_API_KEY) {
      // Return static plans in dev / unconfigured mode
      return InsuranceService._getStaticPlans(userProfile);
    }

    try {
      const response = await client.post('/plans/search', {
        category: 'gig_worker',
        age: userProfile.age,
        city: userProfile.city,
        occupation_type: 'delivery_rideshare',
      });

      logger.debug('Insurance plans fetched', { count: response.data.plans?.length });
      return response.data.plans || [];
    } catch (error) {
      logger.error('Insurance plans fetch failed:', error.message);
      // Fallback to static plans
      return InsuranceService._getStaticPlans(userProfile);
    }
  },

  /**
   * Activate an insurance policy.
   * @param {string} userId
   * @param {string} type — 'accident' | 'health' | 'vehicle' | 'income_protection'
   * @param {number} duration — in days
   * @returns {Promise<{ policyId: string, provider: string, startDate: Date, endDate: Date, premium: number }>}
   */
  async activatePolicy(userId, type, duration) {
    const planType = GIG_INSURANCE_TYPES[type];
    if (!planType) {
      const error = new Error(`Invalid insurance type: ${type}`);
      error.statusCode = 400;
      throw error;
    }

    if (duration < planType.minDuration || duration > planType.maxDuration) {
      const error = new Error(
        `Duration must be between ${planType.minDuration} and ${planType.maxDuration} days`
      );
      error.statusCode = 400;
      throw error;
    }

    if (!INSURANCE_API_KEY) {
      const error = new Error('Insurance service is not configured');
      error.statusCode = 503;
      throw error;
    }

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

      const response = await client.post('/policies/activate', {
        user_id: userId,
        plan_type: type,
        duration_days: duration,
        start_date: startDate.toISOString(),
      });

      const result = {
        policyId: response.data.policy_id,
        provider: response.data.provider || 'acko',
        startDate,
        endDate,
        premium: response.data.premium, // in paise
        coverAmount: response.data.cover_amount, // in paise
        status: 'active',
      };

      logger.info('Insurance policy activated', {
        userId,
        type,
        policyId: result.policyId,
      });

      return result;
    } catch (error) {
      logger.error('Policy activation failed:', error.message);
      const err = new Error('Failed to activate insurance policy');
      err.statusCode = error.response?.status || 500;
      throw err;
    }
  },

  /**
   * Submit an insurance claim.
   * @param {string} policyId
   * @param {{ type: string, description: string, amount: number, documents: string[] }} claimData
   * @returns {Promise<{ claimId: string, status: string }>}
   */
  async submitClaim(policyId, claimData) {
    if (!INSURANCE_API_KEY) {
      const error = new Error('Insurance service is not configured');
      error.statusCode = 503;
      throw error;
    }

    try {
      const response = await client.post(`/policies/${policyId}/claims`, {
        claim_type: claimData.type,
        description: claimData.description,
        claim_amount: claimData.amount, // paise
        document_urls: claimData.documents || [],
      });

      logger.info('Insurance claim submitted', {
        policyId,
        claimId: response.data.claim_id,
      });

      return {
        claimId: response.data.claim_id,
        status: response.data.status || 'submitted',
      };
    } catch (error) {
      logger.error('Claim submission failed:', error.message);
      const err = new Error('Failed to submit insurance claim');
      err.statusCode = error.response?.status || 500;
      throw err;
    }
  },

  /**
   * Check claim status.
   * @param {string} claimId
   * @returns {Promise<{ status: string, approvedAmount: number|null, remarks: string|null }>}
   */
  async getClaimStatus(claimId) {
    if (!INSURANCE_API_KEY) {
      const error = new Error('Insurance service is not configured');
      error.statusCode = 503;
      throw error;
    }

    try {
      const response = await client.get(`/claims/${claimId}`);

      return {
        status: response.data.status,
        approvedAmount: response.data.approved_amount || null,
        remarks: response.data.remarks || null,
      };
    } catch (error) {
      logger.error('Claim status check failed:', error.message);
      const err = new Error('Failed to check claim status');
      err.statusCode = error.response?.status || 500;
      throw err;
    }
  },

  /**
   * Static plan fallback when API is not configured.
   */
  _getStaticPlans(_userProfile) {
    return [
      {
        id: 'accident_basic',
        type: 'accident',
        label: 'Personal Accident — Basic',
        provider: 'Acko',
        coverAmount: 10000000, // ₹1 lakh in paise
        premium: 9900, // ₹99/month in paise
        duration: 30,
        features: ['Accidental death cover', 'Permanent disability', 'Hospital cash'],
      },
      {
        id: 'accident_pro',
        type: 'accident',
        label: 'Personal Accident — Pro',
        provider: 'Acko',
        coverAmount: 50000000, // ₹5 lakh
        premium: 24900, // ₹249/month
        duration: 30,
        features: ['Accidental death cover', 'Partial disability', 'Hospital cash', 'OPD cover'],
      },
      {
        id: 'income_protection',
        type: 'income_protection',
        label: 'Income Protection',
        provider: 'InsuranceDekho',
        coverAmount: 3000000, // ₹30K/month for up to 6 months
        premium: 19900, // ₹199/month
        duration: 30,
        features: ['₹500/day income replacement', 'Covers illness & injury', '7-day waiting period'],
      },
      {
        id: 'vehicle_comp',
        type: 'vehicle',
        label: 'Two-Wheeler Comprehensive',
        provider: 'Acko',
        coverAmount: 7500000, // ₹75K
        premium: 299900, // ₹2,999/year
        duration: 365,
        features: ['Third-party liability', 'Own damage', 'Personal accident', 'Roadside assistance'],
      },
    ];
  },
};

module.exports = InsuranceService;
