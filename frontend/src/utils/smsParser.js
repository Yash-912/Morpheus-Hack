// ============================================================
// SMS Parser — Client-side SMS pre-filter for expense detection
// Parses transaction SMS messages from Indian banks and UPI apps
// ============================================================

// Common Indian bank SMS patterns
const EXPENSE_PATTERNS = [
    // UPI transactions: "Paid Rs.150 to HPCL via UPI"
    /(?:paid|sent|debited)\s*(?:rs\.?|inr\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Card transactions: "INR 500.00 debited from A/c XX1234"
    /(?:inr\.?|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:debited|spent|charged)/i,
    // Reverse pattern: "debited by Rs 250"
    /debited\s*(?:by|for)?\s*(?:rs\.?|inr\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
];

const FUEL_KEYWORDS = ['petrol', 'diesel', 'fuel', 'hpcl', 'bpcl', 'iocl', 'hp petroleum', 'indian oil', 'shell', 'nayara', 'reliance petrol'];
const TOLL_KEYWORDS = ['toll', 'fastag', 'nhai', 'highway'];
const FOOD_KEYWORDS = ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'canteen', 'dhaba', 'mess'];
const MOBILE_KEYWORDS = ['recharge', 'jio', 'airtel', 'vi ', 'bsnl', 'vodafone'];
const MAINTENANCE_KEYWORDS = ['service center', 'mechanic', 'garage', 'puncture', 'tyre', 'oil change', 'servicing'];
const PARKING_KEYWORDS = ['parking', 'park', 'mcgm', 'bbmp'];

/**
 * Check if an SMS is a financial transaction message.
 * @param {string} smsBody
 * @returns {boolean}
 */
export function isTransactionSms(smsBody) {
    if (!smsBody) return false;
    const lower = smsBody.toLowerCase();
    // Must contain a debit/payment keyword
    const hasDebitKeyword = /(?:debited|paid|sent|spent|charged|withdrawn|transfer)/i.test(lower);
    // Must contain a currency indicator
    const hasCurrency = /(?:rs\.?|inr\.?|₹)/i.test(lower);
    return hasDebitKeyword && hasCurrency;
}

/**
 * Check if the SMS is related to fuel expense.
 * @param {string} smsBody
 * @returns {boolean}
 */
export function isFuelSms(smsBody) {
    if (!smsBody) return false;
    const lower = smsBody.toLowerCase();
    return FUEL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Extract the transaction amount from an SMS (in paise).
 * @param {string} smsBody
 * @returns {number|null} amount in paise, or null if not found
 */
export function extractAmount(smsBody) {
    if (!smsBody) return null;

    for (const pattern of EXPENSE_PATTERNS) {
        const match = smsBody.match(pattern);
        if (match) {
            const amountStr = match[1].replace(/,/g, '');
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0) {
                return Math.round(amount * 100); // Convert to paise
            }
        }
    }
    return null;
}

/**
 * Extract merchant name from SMS.
 * Looks for patterns like "to MERCHANT_NAME" or "at MERCHANT_NAME"
 * @param {string} smsBody
 * @returns {string|null}
 */
export function extractMerchant(smsBody) {
    if (!smsBody) return null;

    // Pattern: "to <merchant>" or "at <merchant>" (take max 4 words)
    const toMatch = smsBody.match(/(?:to|at)\s+([A-Za-z0-9][\w\s]{1,40}?)(?:\s+(?:on|via|ref|upi|txn|a\/c|for)|\.|$)/i);
    if (toMatch) {
        return toMatch[1].trim();
    }
    return null;
}

/**
 * Categorize an SMS into an expense category.
 * @param {string} smsBody
 * @returns {'fuel'|'toll'|'food'|'mobile_recharge'|'maintenance'|'parking'|'other'}
 */
export function categorizeExpense(smsBody) {
    if (!smsBody) return 'other';
    const lower = smsBody.toLowerCase();

    if (FUEL_KEYWORDS.some((kw) => lower.includes(kw))) return 'fuel';
    if (TOLL_KEYWORDS.some((kw) => lower.includes(kw))) return 'toll';
    if (FOOD_KEYWORDS.some((kw) => lower.includes(kw))) return 'food';
    if (MOBILE_KEYWORDS.some((kw) => lower.includes(kw))) return 'mobile_recharge';
    if (MAINTENANCE_KEYWORDS.some((kw) => lower.includes(kw))) return 'maintenance';
    if (PARKING_KEYWORDS.some((kw) => lower.includes(kw))) return 'parking';

    return 'other';
}

/**
 * Parse an SMS into a structured expense object.
 * Returns null if SMS is not a transaction.
 * @param {string} smsBody
 * @param {Date|string} [receivedAt] — optional timestamp
 * @returns {object|null}
 */
export function parseSmsToExpense(smsBody, receivedAt = null) {
    if (!isTransactionSms(smsBody)) return null;

    const amount = extractAmount(smsBody);
    if (!amount) return null;

    return {
        amount,
        merchant: extractMerchant(smsBody) || 'Unknown',
        category: categorizeExpense(smsBody),
        source: 'sms_auto',
        smsRaw: smsBody,
        date: receivedAt ? new Date(receivedAt) : new Date(),
        isTaxDeductible: ['fuel', 'toll', 'mobile_recharge', 'maintenance'].includes(categorizeExpense(smsBody)),
    };
}
