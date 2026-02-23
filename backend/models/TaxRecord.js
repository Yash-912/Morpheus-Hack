// ============================================================
// TaxRecord Model Helper — Tax computations & filing status
// ============================================================

const prisma = require('../config/database');

const TaxRecordHelper = {
  // -----------------------------------------------------------
  // Get or create tax record for a financial year
  // -----------------------------------------------------------
  async getOrCreate(userId, financialYear) {
    let record = await prisma.taxRecord.findUnique({
      where: {
        userId_financialYear: { userId, financialYear },
      },
    });

    if (!record) {
      record = await prisma.taxRecord.create({
        data: { userId, financialYear },
      });
    }

    return TaxRecordHelper.serialize(record);
  },

  // -----------------------------------------------------------
  // Update tax record with computed values
  // -----------------------------------------------------------
  async updateComputed(userId, financialYear, computedData) {
    return prisma.taxRecord.upsert({
      where: {
        userId_financialYear: { userId, financialYear },
      },
      update: computedData,
      create: {
        userId,
        financialYear,
        ...computedData,
      },
    });
  },

  // -----------------------------------------------------------
  // Get filing status
  // -----------------------------------------------------------
  async getFilingStatus(userId, financialYear) {
    const record = await prisma.taxRecord.findUnique({
      where: {
        userId_financialYear: { userId, financialYear },
      },
      select: {
        filingStatus: true,
        cleartaxReturnId: true,
        itrForm: true,
        taxPayable: true,
        taxPaid: true,
        refundDue: true,
      },
    });

    if (!record) return null;

    return {
      ...record,
      taxPayable: Number(record.taxPayable),
      taxPaid: Number(record.taxPaid),
      refundDue: Number(record.refundDue),
    };
  },

  // -----------------------------------------------------------
  // Get deduction summary as a structured object
  // -----------------------------------------------------------
  getDeductionSummary(record) {
    return {
      section80c: Number(record.deductionSection80c),
      standardDeduction: Number(record.deductionStandardDeduction),
      fuelExpense: Number(record.deductionFuelExpense),
      vehicleDepreciation: Number(record.deductionVehicleDepreciation),
      mobileExpense: Number(record.deductionMobileExpense),
      otherBusiness: Number(record.deductionOtherBusiness),
      total: Number(record.deductionTotal),
    };
  },

  // -----------------------------------------------------------
  // Serialize for API response (BigInt → Number)
  // -----------------------------------------------------------
  serialize(record) {
    if (!record) return null;
    return {
      ...record,
      grossIncome: Number(record.grossIncome),
      totalExpenses: Number(record.totalExpenses),
      taxableIncome: Number(record.taxableIncome),
      deductionSection80c: Number(record.deductionSection80c),
      deductionStandardDeduction: Number(record.deductionStandardDeduction),
      deductionFuelExpense: Number(record.deductionFuelExpense),
      deductionVehicleDepreciation: Number(record.deductionVehicleDepreciation),
      deductionMobileExpense: Number(record.deductionMobileExpense),
      deductionOtherBusiness: Number(record.deductionOtherBusiness),
      deductionTotal: Number(record.deductionTotal),
      taxPayable: Number(record.taxPayable),
      taxPaid: Number(record.taxPaid),
      refundDue: Number(record.refundDue),
    };
  },
};

module.exports = TaxRecordHelper;
