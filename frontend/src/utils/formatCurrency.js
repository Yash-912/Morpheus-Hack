// ============================================================
// Currency Formatter — Paise ↔ Rupees for frontend display
// All backend values are stored in paise (BigInt).
// ============================================================

/**
 * Format paise amount to Indian Rupee display string.
 * e.g., 123456 → "₹1,234.56"
 * @param {number|string} paise
 * @param {object} [options]
 * @param {boolean} [options.showSign] — Show + for positive amounts
 * @param {boolean} [options.compact] — Use compact notation (₹1.2K, ₹5L)
 * @returns {string}
 */
export function formatCurrency(paise, options = {}) {
    const amount = Number(paise) / 100;
    const { showSign = false, compact = false } = options;

    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: compact ? 0 : 2,
        maximumFractionDigits: compact ? 1 : 2,
        notation: compact ? 'compact' : 'standard',
    }).format(Math.abs(amount));

    if (showSign && amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
}

/**
 * Format paise to a plain number (no ₹ symbol).
 * e.g., 123456 → "1,234.56"
 * @param {number|string} paise
 * @returns {string}
 */
export function formatAmount(paise) {
    const amount = Number(paise) / 100;
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Convert paise to rupees (number, not string).
 * @param {number|string} paise
 * @returns {number}
 */
export function paiseToRupees(paise) {
    return Number(paise) / 100;
}

/**
 * Convert rupees to paise (integer).
 * @param {number} rupees
 * @returns {number}
 */
export function rupeesToPaise(rupees) {
    return Math.round(Number(rupees) * 100);
}

/**
 * Format percentage value.
 * e.g., 0.156 → "15.6%"
 * @param {number} value — decimal (0.156 = 15.6%)
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
    return `${(Number(value) * 100).toFixed(decimals)}%`;
}
