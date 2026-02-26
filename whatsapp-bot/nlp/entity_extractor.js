// ============================================================
// Entity Extractor — amounts, dates, platforms from user messages
// ============================================================

/**
 * Extract a monetary amount from text.
 * Handles: ₹500, Rs 500, Rs. 500, INR 500, 500, 1,000, 1.5k
 * Returns amount in PAISE (integer).
 */
function extractAmount(text) {
    if (!text) return null;

    // Handle "1.5k" / "2k" style
    const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
        const rupees = parseFloat(kMatch[1]) * 1000;
        return Math.round(rupees * 100);
    }

    // Handle ₹, Rs., Rs, INR prefix or bare number
    const match = text.match(/(?:₹|rs\.?\s*|inr\s*)?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i);
    if (match) {
        const raw = match[1].replace(/,/g, '');
        const rupees = parseFloat(raw);
        if (!isNaN(rupees) && rupees > 0 && rupees <= 50000) {
            return Math.round(rupees * 100);
        }
    }

    return null;
}

/**
 * Extract a date from text.
 * Handles: today, yesterday, tomorrow, DD/MM/YYYY, YYYY-MM-DD
 */
function extractDate(text) {
    if (!text) return null;

    const lower = text.toLowerCase();
    const now = new Date();

    if (/\btoday\b|\baaj\b/.test(lower)) return new Date();
    if (/\byesterday\b|\bkal\b/.test(lower)) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
    }
    if (/\btomorrow\b|\bparso\b/.test(lower)) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        return new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);
    }

    // YYYY-MM-DD
    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return new Date(isoMatch[0]);

    return null;
}

/**
 * Extract a platform name from text.
 */
function extractPlatform(text) {
    if (!text) return null;
    const match = text.match(/\b(zomato|swiggy|ola|uber|dunzo|rapido)\b/i);
    return match ? match[1].toLowerCase() : null;
}

/**
 * Extract UPI ID from text.
 */
function extractUpiId(text) {
    if (!text) return null;
    const match = text.match(/[\w.\-]+@[\w.\-]+/);
    return match ? match[0] : null;
}

/**
 * Extract phone number (Indian 10-digit).
 */
function extractPhone(text) {
    if (!text) return null;
    const match = text.match(/(?:\+91|0)?([6-9]\d{9})/);
    return match ? '+91' + match[1] : null;
}

module.exports = {
    extractAmount,
    extractDate,
    extractPlatform,
    extractUpiId,
    extractPhone,
};
