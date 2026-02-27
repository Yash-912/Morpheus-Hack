// ============================================================
// Tax Service — Indian tax calculation engine for gig workers
// ============================================================

const logger = require('../utils/logger.utils');
const { prisma } = require('../config/database');
const { getFY } = require('../config/constants');
const { paiseToRupees, rupeesToPaise } = require('../utils/formatters.utils');

// Indian tax slabs (FY 2024-25 onwards)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

const STANDARD_DEDUCTION = 75000; // ₹75,000 for salaried/pension (new regime 2024-25)
const SECTION_80C_MAX = 150000;

const REBATE_87A_LIMIT_OLD = 500000;
const REBATE_87A_LIMIT_NEW = 700000;
const REBATE_87A_MAX_NEW = 25000;
const REBATE_87A_MAX_OLD = 12500;
const HEALTH_EDUCATION_CESS = 0.04;

// Section 44AD: Presumptive taxation for small businesses
const PRESUMPTIVE_44AD_RATE = 0.06; // 6% of digital receipts treated as profit (8% for cash)
const PRESUMPTIVE_TURNOVER_LIMIT = 20000000; // ₹2 crore limit (₹3 crore with digital threshold)

// ---- Advance tax due dates for a given FY ----
const ADVANCE_TAX_DATES = (fy) => {
  const startYear = parseInt(fy.split('-')[0], 10);
  return [
    { dueDate: new Date(startYear, 5, 15), percent: 15, label: 'Q1 — 15th June' },
    { dueDate: new Date(startYear, 8, 15), percent: 45, label: 'Q2 — 15th September' },
    { dueDate: new Date(startYear + 1, 0, 15), percent: 75, label: 'Q3 — 15th December' },
    { dueDate: new Date(startYear + 1, 2, 15), percent: 100, label: 'Q4 — 15th March' },
  ];
};

/**
 * Apply tax slabs to taxable income.
 */
function computeSlabTax(taxableIncome, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome <= slab.min) break;
    const slabIncome = Math.min(taxableIncome, slab.max) - slab.min;
    tax += slabIncome * slab.rate;
  }
  return Math.round(tax);
}

const TaxService = {
  /**
   * Calculate full tax liability for a user in a financial year.
   * Aggregates earnings & expenses from DB, applies presumptive taxation.
   * @param {string} userId
   * @param {string} fy — e.g. "2024-2025"
   * @returns {Promise<Object>} tax record
   */
  async calculateTaxLiability(userId, fy) {
    const currentFy = fy || getFY();
    const [startYear] = currentFy.split('-').map(Number);
    const fyStart = new Date(startYear, 3, 1); // April 1
    const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31

    // Aggregate earnings in paise
    const earningsAgg = await prisma.earning.aggregate({
      where: {
        userId,
        date: { gte: fyStart, lte: fyEnd },
      },
      _sum: { netAmount: true },
    });

    const grossIncomePaise = Number(earningsAgg._sum.netAmount || 0);
    const grossIncome = paiseToRupees(grossIncomePaise);

    // Aggregate deductible expenses in paise
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: fyStart, lte: fyEnd },
      },
    });

    const totalExpensesPaise = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalExpenses = paiseToRupees(totalExpensesPaise);

    // ---- Presumptive taxation (Section 44AD) ----
    const presumptiveProfit = Math.round(grossIncome * PRESUMPTIVE_44AD_RATE);
    const actualProfit = grossIncome - totalExpenses;
    const usePresumptive = TaxService.isPresumedTaxationBetter(grossIncome, totalExpenses);

    const taxableBusinessIncome = usePresumptive ? presumptiveProfit : actualProfit;

    // ---- Compare regimes ----
    const comparison = TaxService.compareRegimes(taxableBusinessIncome, {
      section80C: 0, // Will be populated from user data
      section80D: 0,
    });

    const liability = comparison.recommended === 'new' ? comparison.newRegimeTax : comparison.oldRegimeTax;

    logger.info('Tax liability calculated', {
      userId,
      fy: currentFy,
      grossIncome,
      taxableBusinessIncome,
      liability,
      regime: comparison.recommended,
    });

    return {
      fy: currentFy,
      grossIncome: rupeesToPaise(grossIncome),
      totalExpenses: rupeesToPaise(totalExpenses),
      presumptiveProfit: rupeesToPaise(presumptiveProfit),
      actualProfit: rupeesToPaise(actualProfit),
      usePresumptive,
      taxableIncome: rupeesToPaise(taxableBusinessIncome),
      oldRegimeTax: rupeesToPaise(comparison.oldRegimeTax),
      newRegimeTax: rupeesToPaise(comparison.newRegimeTax),
      recommendedRegime: comparison.recommended,
      totalTax: rupeesToPaise(liability),
      cess: rupeesToPaise(Math.round(liability * HEALTH_EDUCATION_CESS)),
      totalPayable: rupeesToPaise(Math.round(liability * (1 + HEALTH_EDUCATION_CESS))),
    };
  },

  /**
   * Get deduction suggestions the user may have missed.
   * @param {string} userId
   * @param {string} fy
   * @returns {Promise<Array<{category: string, label: string, maxAmount: number, currentClaimed: number}>>}
   */
  async getDeductionSuggestions(userId, fy) {
    const currentFy = fy || getFY();
    const [startYear] = currentFy.split('-').map(Number);
    const fyStart = new Date(startYear, 3, 1);
    const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: fyStart, lte: fyEnd },
        isTaxDeductible: true,
      },
    });

    const claimedByCategory = {};
    expenses.forEach((e) => {
      claimedByCategory[e.category] = (claimedByCategory[e.category] || 0) + Number(e.amount);
    });

    const suggestions = [
      {
        category: 'fuel',
        label: 'Fuel expenses',
        maxAmount: null,
        currentClaimed: paiseToRupees(claimedByCategory.fuel || 0),
        tip: 'Track all fuel receipts — fully deductible for gig workers',
      },
      {
        category: 'vehicle_maintenance',
        label: 'Vehicle maintenance & repairs',
        maxAmount: null,
        currentClaimed: paiseToRupees(claimedByCategory.vehicle_maintenance || 0),
        tip: 'Include oil changes, tyre replacements, servicing',
      },
      {
        category: 'phone_recharge',
        label: 'Phone & data recharges',
        maxAmount: null,
        currentClaimed: paiseToRupees(claimedByCategory.phone_recharge || 0),
        tip: 'Mobile data is essential for gig work — deductible',
      },

      {
        category: 'section_80c',
        label: 'Section 80C investments',
        maxAmount: SECTION_80C_MAX,
        currentClaimed: 0, // Would need investment data
        tip: 'PPF, ELSS, LIC premiums — up to ₹1.5 lakh',
      },
    ];

    return suggestions;
  },

  /**
   * Compare old regime vs new regime tax.
   * @param {number} taxableIncome — in rupees
   * @param {{ section80C?: number, section80D?: number }} deductions — in rupees
   * @returns {{ oldRegimeTax: number, newRegimeTax: number, recommended: string, savings: number }}
   */
  compareRegimes(taxableIncome, deductions = {}) {
    // ---- Old Regime (with deductions) ----
    const oldTaxableIncome = Math.max(
      0,
      taxableIncome - (deductions.section80C || 0) - (deductions.section80D || 0)
    );
    let oldTax = computeSlabTax(oldTaxableIncome, OLD_REGIME_SLABS);

    // 87A rebate for old regime
    if (oldTaxableIncome <= REBATE_87A_LIMIT_OLD) {
      oldTax = Math.max(0, oldTax - REBATE_87A_MAX_OLD);
    }

    const oldTaxWithCess = Math.round(oldTax * (1 + HEALTH_EDUCATION_CESS));

    // ---- New Regime (standard deduction only, no 80C/80D) ----
    const newTaxableIncome = Math.max(0, taxableIncome - STANDARD_DEDUCTION);
    let newTax = computeSlabTax(newTaxableIncome, NEW_REGIME_SLABS);

    // 87A rebate for new regime
    if (newTaxableIncome <= REBATE_87A_LIMIT_NEW) {
      newTax = Math.max(0, newTax - REBATE_87A_MAX_NEW);
    }

    const newTaxWithCess = Math.round(newTax * (1 + HEALTH_EDUCATION_CESS));

    const recommended = newTaxWithCess <= oldTaxWithCess ? 'new' : 'old';

    return {
      oldRegimeTax: oldTaxWithCess,
      newRegimeTax: newTaxWithCess,
      recommended,
      savings: Math.abs(oldTaxWithCess - newTaxWithCess),
    };
  },

  /**
   * Get advance tax due dates with estimated amounts.
   * @param {string} fy — e.g. "2024-2025"
   * @param {number} estimatedTax — total estimated annual tax in rupees
   * @returns {Array<{dueDate: Date, percent: number, label: string, cumulativeAmount: number}>}
   */
  getAdvanceTaxDueDates(fy, estimatedTax = 0) {
    const dates = ADVANCE_TAX_DATES(fy || getFY());
    return dates.map((d) => ({
      ...d,
      cumulativeAmount: Math.round((estimatedTax * d.percent) / 100),
    }));
  },

  /**
   * Determine if presumptive taxation (Section 44AD) is better.
   * @param {number} grossIncome — in rupees
   * @param {number} actualExpenses — in rupees
   * @returns {boolean}
   */
  isPresumedTaxationBetter(grossIncome, actualExpenses) {
    if (grossIncome > paiseToRupees(PRESUMPTIVE_TURNOVER_LIMIT * 100)) {
      return false; // Exceeds turnover limit
    }
    const presumptiveProfit = grossIncome * PRESUMPTIVE_44AD_RATE;
    const actualProfit = grossIncome - actualExpenses;
    // If actual profit is higher than presumptive, use presumptive (lower taxable income)
    return presumptiveProfit < actualProfit;
  },
};

module.exports = TaxService;
