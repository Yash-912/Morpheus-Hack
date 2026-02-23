// ============================================================
// Display Formatters — currency, dates, percentages
// All monetary amounts stored as paise (BigInt) internally
// ============================================================

/**
 * Format paise amount to Indian Rupee display string.
 * e.g., 123456 → "₹1,234.56"
 * @param {number|bigint} paise
 * @returns {string}
 */
function formatCurrency(paise) {
  const amount = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format paise to a plain number with 2 decimals (no currency symbol).
 * e.g., 123456 → "1,234.56"
 * @param {number|bigint} paise
 * @returns {string}
 */
function formatAmount(paise) {
  const amount = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert paise to rupees (number, not string).
 * @param {number|bigint} paise
 * @returns {number}
 */
function paiseToRupees(paise) {
  return Number(paise) / 100;
}

/**
 * Convert rupees to paise (integer).
 * @param {number} rupees
 * @returns {number}
 */
function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * Format a Date to IST date string.
 * e.g., "23 Feb 2026"
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateIST(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a Date to IST date+time string.
 * e.g., "23 Feb 2026, 2:30 PM"
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateTimeIST(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD) in IST.
 * @param {Date|string} date
 * @returns {string}
 */
function formatISODateIST(date) {
  const d = new Date(date);
  // Shift to IST (+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + istOffset);
  return ist.toISOString().split('T')[0];
}

/**
 * Format a percentage value.
 * e.g., 0.156 → "15.6%"
 * @param {number} value — decimal (0.156 = 15.6%)
 * @param {number} [decimals=1]
 * @returns {string}
 */
function formatPercent(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

module.exports = {
  formatCurrency,
  formatAmount,
  paiseToRupees,
  rupeesToPaise,
  formatDateIST,
  formatDateTimeIST,
  formatISODateIST,
  formatPercent,
};
