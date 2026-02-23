// ============================================================
// App-Wide Constants — fees, limits, thresholds (amounts in paise)
// ============================================================

module.exports = {
  // ---- Payout Fees ----
  PAYOUT_FEE_PERCENT: 0.012,           // 1.2% standard payout fee
  INSTANT_PAYOUT_FEE_PERCENT: 0.015,   // 1.5% instant payout fee
  PAYOUT_FEE_FLAT: 500,                // ₹5 flat fee (in paise)

  // ---- Payout Limits ----
  DAILY_CASHOUT_LIMIT: 5000000,        // ₹50,000 daily withdrawal limit (paise)
  SETTLEMENT_BUFFER_PERCENT: 0.10,     // 10% buffer held from platform settlements

  // ---- Loan Parameters ----
  MAX_LOAN_AMOUNT: 500000,             // ₹5,000 max loan (paise)
  LOAN_INTEREST_RATE_MONTHLY: 0.02,    // 2% monthly interest
  GIGSCORE_MIN_FOR_LOAN: 400,          // Minimum GigScore for loan eligibility

  // ---- Community Marketplace ----
  COMMUNITY_PLATFORM_FEE: 0.05,       // 5% platform fee on completed jobs

  // ---- Subscription ----
  GIG_PRO_PRICE: 9900,                // ₹99/month Gig Pro subscription (paise)

  // ---- Platform Enum Map ----
  PLATFORMS: {
    zomato: { name: 'Zomato', color: '#E23744' },
    swiggy: { name: 'Swiggy', color: '#FC8019' },
    ola: { name: 'Ola', color: '#8CC63F' },
    uber: { name: 'Uber', color: '#000000' },
    dunzo: { name: 'Dunzo', color: '#00D290' },
    other: { name: 'Other', color: '#6B7280' },
  },

  // ---- Expense Categories ----
  EXPENSE_CATEGORIES: {
    fuel: { label: 'Fuel', icon: '⛽', taxDeductible: true },
    vehicle_maintenance: { label: 'Vehicle Maintenance', icon: '🔧', taxDeductible: true },
    phone_recharge: { label: 'Phone Recharge', icon: '📱', taxDeductible: true },
    toll: { label: 'Toll', icon: '🛣️', taxDeductible: true },
    food: { label: 'Food', icon: '🍔', taxDeductible: false },
    insurance_premium: { label: 'Insurance Premium', icon: '🛡️', taxDeductible: true },
    emi: { label: 'EMI', icon: '💳', taxDeductible: false },
    other: { label: 'Other', icon: '📦', taxDeductible: false },
  },

  // ---- Indian Financial Year ----
  getFY(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    // FY starts April 1 (month 3)
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  },

  // ---- Supported Cities (Phase 1) ----
  SUPPORTED_CITIES: ['bangalore', 'delhi', 'mumbai', 'hyderabad', 'chennai'],

  // ---- Pagination Defaults ----
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // ---- OTP ----
  OTP_EXPIRY_MINUTES: 10,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RATE_LIMIT_WINDOW_MINUTES: 10,
  OTP_RATE_LIMIT_MAX: 3,

  // ---- JWT ----
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '30d',
};
