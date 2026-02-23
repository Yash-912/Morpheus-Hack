// ============================================================
// Custom Validators — Indian-specific format checks
// ============================================================

/**
 * Indian phone number: +91 followed by 10 digits.
 * Accepts with or without country code.
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Normalize phone number to +91XXXXXXXXXX format.
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
}

/**
 * Aadhaar number: 12 digits, no leading zero.
 * @param {string} aadhaar
 * @returns {boolean}
 */
function isValidAadhaar(aadhaar) {
  return /^[1-9]\d{11}$/.test(aadhaar.replace(/\s/g, ''));
}

/**
 * PAN card: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F).
 * @param {string} pan
 * @returns {boolean}
 */
function isValidPAN(pan) {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(pan.toUpperCase());
}

/**
 * UPI ID: username@provider (e.g., user@upi, user@paytm).
 * @param {string} upiId
 * @returns {boolean}
 */
function isValidUPI(upiId) {
  return /^[\w.\-]+@[\w]+$/.test(upiId);
}

/**
 * IFSC code: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234).
 * @param {string} ifsc
 * @returns {boolean}
 */
function isValidIFSC(ifsc) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
}

/**
 * Validates that a paise amount is within an acceptable range.
 * @param {number} amount — amount in paise
 * @param {number} [min=100] — minimum (₹1)
 * @param {number} [max=10000000] — maximum (₹1,00,000)
 * @returns {{valid: boolean, reason?: string}}
 */
function isValidAmount(amount, min = 100, max = 10000000) {
  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return { valid: false, reason: 'Amount must be an integer (paise)' };
  }
  if (amount < min) {
    return { valid: false, reason: `Amount must be at least ₹${min / 100}` };
  }
  if (amount > max) {
    return { valid: false, reason: `Amount cannot exceed ₹${max / 100}` };
  }
  return { valid: true };
}

/**
 * Validate Indian financial year format: "2025-2026".
 * @param {string} fy
 * @returns {boolean}
 */
function isValidFY(fy) {
  const match = fy.match(/^(\d{4})-(\d{4})$/);
  if (!match) return false;
  return parseInt(match[2]) - parseInt(match[1]) === 1;
}

module.exports = {
  isValidPhone,
  normalizePhone,
  isValidAadhaar,
  isValidPAN,
  isValidUPI,
  isValidIFSC,
  isValidAmount,
  isValidFY,
};
