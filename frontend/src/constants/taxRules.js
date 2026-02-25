// ============================================================
// Tax Rules — Indian income tax constants for gig workers
// Usage: import { TAX_SLABS, calculateTax } from '../constants/taxRules';
// ============================================================

// Financial year helper
export function getCurrentFY() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    if (month < 3) {
        return `${year - 1}-${String(year).slice(2)}`;
    }
    return `${year}-${String(year + 1).slice(2)}`;
}

// ── New Regime (FY 2025-26 onwards) ─────────────────────────
export const NEW_REGIME_SLABS = [
    { min: 0, max: 400000, rate: 0 },
    { min: 400000, max: 800000, rate: 0.05 },
    { min: 800000, max: 1200000, rate: 0.10 },
    { min: 1200000, max: 1600000, rate: 0.15 },
    { min: 1600000, max: 2000000, rate: 0.20 },
    { min: 2000000, max: 2400000, rate: 0.25 },
    { min: 2400000, max: Infinity, rate: 0.30 },
];

// ── Old Regime ──────────────────────────────────────────────
export const OLD_REGIME_SLABS = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 1000000, rate: 0.20 },
    { min: 1000000, max: Infinity, rate: 0.30 },
];

// ── Section 44AD — Presumptive Taxation ─────────────────────
// For gig workers with turnover < ₹3 Cr (digital receipts)
export const PRESUMPTIVE_44AD = {
    digitalIncomeRate: 0.06, // 6% of digital turnover is deemed profit
    cashIncomeRate: 0.08,    // 8% of cash turnover
    turnoverLimit: 30000000, // ₹3 Cr in paise? No — this is in rupees
    description: 'Section 44AD — 6% of digital earnings treated as taxable profit',
};

// ── Section 44ADA — For Professionals ───────────────────────
export const PRESUMPTIVE_44ADA = {
    profitRate: 0.50, // 50% of gross receipts
    turnoverLimit: 7500000, // ₹75L
    description: 'Section 44ADA — 50% of gross receipts treated as taxable profit',
};

// ── Standard Deduction ──────────────────────────────────────
export const STANDARD_DEDUCTION = {
    newRegime: 75000, // ₹75,000 (FY 2025-26)
    oldRegime: 50000, // ₹50,000
};

// ── Section 80C Limit ───────────────────────────────────────
export const SECTION_80C_LIMIT = 150000; // ₹1.5L

// ── Health & Education Cess ─────────────────────────────────
export const CESS_RATE = 0.04; // 4%

// ── Surcharge thresholds ────────────────────────────────────
export const SURCHARGE_SLABS = [
    { min: 0, max: 5000000, rate: 0 },
    { min: 5000000, max: 10000000, rate: 0.10 },
    { min: 10000000, max: 20000000, rate: 0.15 },
    { min: 20000000, max: 50000000, rate: 0.25 },
    { min: 50000000, max: Infinity, rate: 0.37 },
];

// ── Advance Tax Due Dates ───────────────────────────────────
export const ADVANCE_TAX_DATES = [
    { date: 'June 15', percent: 15, description: 'First installment' },
    { date: 'September 15', percent: 45, description: 'Second installment (cumulative)' },
    { date: 'December 15', percent: 75, description: 'Third installment (cumulative)' },
    { date: 'March 15', percent: 100, description: 'Final installment' },
];

// ── Common deductible expense categories for gig workers ────
export const DEDUCTIBLE_CATEGORIES = [
    { key: 'fuel', label: 'Fuel & Petrol', section: 'Business expense' },
    { key: 'toll', label: 'Toll & FASTag', section: 'Business expense' },
    { key: 'maintenance', label: 'Vehicle Maintenance', section: 'Business expense' },
    { key: 'mobile_recharge', label: 'Mobile Recharge', section: 'Business expense' },
    { key: 'vehicle_depreciation', label: 'Vehicle Depreciation', section: 'Depreciation (Sec 32)' },
    { key: 'insurance_premium', label: 'Vehicle Insurance', section: 'Business expense' },
    { key: 'section_80c', label: 'Section 80C (PPF, ELSS, etc.)', section: 'Chapter VI-A' },
];

/**
 * Calculate tax under a specific regime.
 * @param {number} taxableIncome — in rupees
 * @param {'old'|'new'} regime
 * @returns {{ baseTax: number, cess: number, totalTax: number }}
 */
export function calculateTax(taxableIncome, regime = 'new') {
    const slabs = regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
    let baseTax = 0;

    for (const slab of slabs) {
        if (taxableIncome <= slab.min) break;
        const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
        baseTax += taxableInSlab * slab.rate;
    }

    // Section 87A rebate (new regime: income up to ₹12L, old: up to ₹5L)
    if (regime === 'new' && taxableIncome <= 1200000) {
        baseTax = 0;
    } else if (regime === 'old' && taxableIncome <= 500000) {
        baseTax = 0;
    }

    const cess = baseTax * CESS_RATE;
    const totalTax = Math.round(baseTax + cess);

    return { baseTax: Math.round(baseTax), cess: Math.round(cess), totalTax };
}

/**
 * Compare both regimes for a given income.
 * @param {number} grossIncome — in rupees
 * @param {number} totalDeductions — in rupees (only applicable in old regime)
 * @returns {object}
 */
export function compareRegimes(grossIncome, totalDeductions = 0) {
    // New regime: limited deductions
    const newTaxableIncome = Math.max(0, grossIncome - STANDARD_DEDUCTION.newRegime);
    const newTax = calculateTax(newTaxableIncome, 'new');

    // Old regime: full deductions allowed
    const oldTaxableIncome = Math.max(0, grossIncome - STANDARD_DEDUCTION.oldRegime - totalDeductions);
    const oldTax = calculateTax(oldTaxableIncome, 'old');

    const savings = oldTax.totalTax - newTax.totalTax;

    return {
        newRegime: { taxableIncome: newTaxableIncome, ...newTax },
        oldRegime: { taxableIncome: oldTaxableIncome, ...oldTax },
        recommended: savings > 0 ? 'new' : 'old',
        savings: Math.abs(savings),
    };
}
