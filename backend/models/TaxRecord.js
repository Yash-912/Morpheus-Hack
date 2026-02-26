// ============================================================
// TaxRecord Model — Query helpers
// Usage: const TaxRecordModel = require('../models/TaxRecord');
// ============================================================

const { prisma } = require('../config/database');

const TaxRecordModel = {
    /**
     * Get or create a tax record for a user and financial year.
     * Ensures a single record per user per FY.
     */
    async getOrCreate(userId, financialYear) {
        let record = await prisma.taxRecord.findUnique({
            where: {
                userId_financialYear: { userId, financialYear },
            },
        });

        if (!record) {
            record = await prisma.taxRecord.create({
                data: {
                    userId,
                    financialYear,
                },
            });
        }

        return {
            ...record,
            grossIncome: Number(record.grossIncome),
            totalExpenses: Number(record.totalExpenses),
            taxableIncome: Number(record.taxableIncome),
            taxPayable: Number(record.taxPayable),
            taxPaid: Number(record.taxPaid),
            refundDue: Number(record.refundDue),
            deductionSection80c: Number(record.deductionSection80c),
            deductionStandardDeduction: Number(record.deductionStandardDeduction),
            deductionFuelExpense: Number(record.deductionFuelExpense),
            deductionVehicleDepreciation: Number(record.deductionVehicleDepreciation),
            deductionMobileExpense: Number(record.deductionMobileExpense),
            deductionOtherBusiness: Number(record.deductionOtherBusiness),
            deductionTotal: Number(record.deductionTotal),
        };
    },

    /**
     * Get the current financial year string (e.g., "2025-26").
     */
    getCurrentFY() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed: 0=Jan, 3=Apr
        // FY starts in April: if Jan-Mar, FY started previous year
        if (month < 3) {
            return `${year - 1}-${String(year).slice(2)}`;
        }
        return `${year}-${String(year + 1).slice(2)}`;
    },

    /**
     * Get all tax records for a user, ordered by financial year.
     */
    async getAllForUser(userId) {
        const records = await prisma.taxRecord.findMany({
            where: { userId },
            orderBy: { financialYear: 'desc' },
        });

        return records.map((r) => ({
            ...r,
            grossIncome: Number(r.grossIncome),
            totalExpenses: Number(r.totalExpenses),
            taxableIncome: Number(r.taxableIncome),
            taxPayable: Number(r.taxPayable),
            taxPaid: Number(r.taxPaid),
            refundDue: Number(r.refundDue),
            deductionTotal: Number(r.deductionTotal),
        }));
    },
};

module.exports = TaxRecordModel;
