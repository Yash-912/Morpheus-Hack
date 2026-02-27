// ============================================================
// TDS Controller — Mock Tax Compliance for Hackathon Demo
// Simulates Form 26AS fetch and ITR filing via delays.
// ============================================================

const logger = require('../utils/logger.utils');

/**
 * MOCK Form 26AS data — simulates what the TRACES portal returns.
 * Shows 2% TDS deducted by Zomato and Swiggy across multiple quarters.
 */
function getMockTdsSummary(pan) {
    return {
        pan: pan || 'ABCDE1234F',
        financialYear: '2024-25',
        assessmentYear: '2025-26',
        taxpayerName: 'Rajesh Kumar',
        totalIncomeReported: 425000,
        totalTdsDeducted: 8500,
        deductors: [
            {
                name: 'Zomato Hyperpure Private Limited',
                tan: 'MUMZ12345A',
                totalPaid: 250000,
                tdsDeducted: 5000,
                quarters: [
                    { quarter: 'Q1 (Apr-Jun)', paid: 65000, tds: 1300 },
                    { quarter: 'Q2 (Jul-Sep)', paid: 70000, tds: 1400 },
                    { quarter: 'Q3 (Oct-Dec)', paid: 60000, tds: 1200 },
                    { quarter: 'Q4 (Jan-Mar)', paid: 55000, tds: 1100 },
                ],
            },
            {
                name: 'Bundl Technologies Pvt Ltd (Swiggy)',
                tan: 'BLRS98765B',
                totalPaid: 175000,
                tdsDeducted: 3500,
                quarters: [
                    { quarter: 'Q1 (Apr-Jun)', paid: 45000, tds: 900 },
                    { quarter: 'Q2 (Jul-Sep)', paid: 50000, tds: 1000 },
                    { quarter: 'Q3 (Oct-Dec)', paid: 42000, tds: 840 },
                    { quarter: 'Q4 (Jan-Mar)', paid: 38000, tds: 760 },
                ],
            },
        ],
        // Section 44ADA Presumptive Taxation calculation
        presumptiveTax: {
            scheme: 'Section 44ADA',
            grossIncome: 425000,
            presumptiveRate: 0.50,            // 50% of gross is taxable
            presumptiveIncome: 212500,        // ₹4,25,000 × 50%
            basicExemption: 300000,           // New regime ₹3L exemption
            taxableIncome: 0,                 // ₹2,12,500 < ₹3,00,000 → Zero
            taxPayable: 0,
            tdsAlreadyPaid: 8500,
            refundDue: 8500,                  // Full TDS is refundable!
        },
    };
}

const tdsController = {
    /**
     * GET /api/taxes/tds-summary/:pan
     * Mock endpoint that "fetches" Form 26AS data from TRACES.
     */
    async getTdsSummary(req, res, next) {
        try {
            const { pan } = req.params;

            // Validate PAN format (ABCDE1234F)
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(pan)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'INVALID_PAN', message: 'Invalid PAN format. Expected: ABCDE1234F' },
                });
            }

            const summary = getMockTdsSummary(pan);

            logger.info('TDS summary fetched (mock)', { userId: req.user?.id, pan });

            res.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/taxes/submit-itr
     * Mock ITR filing endpoint.
     * ⚡ CRITICAL DEMO ILLUSION: 2.5-second delay simulates real API transaction.
     */
    async submitItr(req, res, next) {
        try {
            const { pan, financialYear, consentGiven } = req.body;

            if (!consentGiven) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'CONSENT_REQUIRED', message: 'You must consent to e-filing before submission.' },
                });
            }

            logger.info('ITR submission started (mock)', { userId: req.user?.id, pan, financialYear });

            // ⚡ THE KEY ILLUSION: 2.5-second delay makes it feel like a real API call
            await new Promise((resolve) => setTimeout(resolve, 2500));

            // Generate a fake acknowledgment number
            const ackNumber = `ACK${Date.now().toString().slice(-10)}`;

            res.json({
                success: true,
                data: {
                    acknowledgmentNumber: ackNumber,
                    filingDate: new Date().toISOString(),
                    itrForm: 'ITR-4 (Sugam)',
                    assessmentYear: '2025-26',
                    refundAmount: 8500,
                    estimatedRefundDate: '45-60 business days',
                    status: 'E-VERIFIED',
                    message: `ITR filed successfully! Acknowledgment: ${ackNumber}. Your refund of ₹8,500 will be credited to your bank account in 45-60 business days.`,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = tdsController;
