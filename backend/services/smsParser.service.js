// ============================================================
// SMS Parser Service — Phase 2: regex-based SMS → Transaction
// ============================================================

/**
 * Parse a single SMS message into a structured transaction.
 * Returns { amount, direction, category, merchant, confidence }
 */
function parseSms(sender, body) {
    const upper = body.toUpperCase();
    const senderUpper = (sender || '').toUpperCase();

    // ── STEP 1: Extract amount ──
    const amount = extractAmount(body);

    // ── STEP 2: Determine direction ──
    const direction = determineDirection(upper, senderUpper);

    // ── STEP 3: Determine category ──
    const category = determineCategory(senderUpper, upper, direction);

    // ── STEP 4: Extract merchant ──
    const merchant = extractMerchant(body, senderUpper);

    // ── STEP 5: Confidence score ──
    const confidence = computeConfidence(amount, direction, category);

    // ── STEP 6: Extract trips count (gig earnings only) ──
    const tripsCount = extractTripsCount(body);

    // Fix direction for INCOME if needed
    const finalDirection = category === 'INCOME' ? 'credit' : direction;

    // ── STEP 7: Extract date from body ──
    const parsedDate = extractDate(body);

    return {
        amount: amount || 0,
        direction: finalDirection,
        category,
        merchant,
        confidence,
        tripsCount,
        parsedDate,
    };
}

// ── Amount Extraction ──────────────────────────────────────

function extractAmount(body) {
    // Patterns in priority order:
    // Rs. / Rs / INR / ₹ followed by optional space and digits with optional commas and decimals
    const patterns = [
        /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/gi,
        /(?:amount|amt)[:\s]*([\d,]+(?:\.\d{1,2})?)/gi,
        /(?:debited|credited|paid|received|sent|deducted)\s+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(body);
        if (match) {
            const raw = match[1].replace(/,/g, '');
            const parsed = parseFloat(raw);
            if (!isNaN(parsed) && parsed > 0) return parsed;
        }
    }

    return null;
}

// ── Direction Detection ────────────────────────────────────

const CREDIT_KEYWORDS = [
    'CREDITED', 'RECEIVED', 'ADDED', 'DEPOSITED', 'REFUND',
    'CASHBACK', 'PAYMENT RECEIVED', 'TRANSFERRED TO YOUR',
    'CREDIT', 'PAID OUT', 'PAYOUT', 'EARNINGS',
];

const DEBIT_KEYWORDS = [
    'DEBITED', 'DEDUCTED', 'PAID', 'SPENT', 'SENT',
    'TRANSFERRED FROM', 'PAYMENT OF', 'CHARGED',
    'DEBIT', 'WITHDRAWN', 'PURCHASE',
];

function determineDirection(upper, senderUpper) {
    let creditScore = 0;
    let debitScore = 0;

    for (const kw of CREDIT_KEYWORDS) {
        if (upper.includes(kw)) creditScore++;
    }
    for (const kw of DEBIT_KEYWORDS) {
        if (upper.includes(kw)) debitScore++;
    }

    if (creditScore > debitScore) return 'credit';
    if (debitScore > creditScore) return 'debit';
    return 'debit'; // default to debit if unclear
}

// ── Category Detection ─────────────────────────────────────

const GIG_PLATFORMS = [
    'ZOMATO', 'SWIGGY', 'OLARIDE', 'UBERIND', 'DUNZOW', 'BLINKT', 'ZEPTON',
    'BIGBAS', 'RAPIDO', 'PORTER', 'URBANC', 'FKQCOM', 'AMZFLX', 'JIOMRT',
];
const INCOME_BODY_KEYWORDS = ['CREDITED', 'PAID OUT', 'WEEKLY PAYMENT', 'EARNINGS', 'TRANSFERRED', 'PAYOUT', 'EARNED'];
const FOOD_KEYWORDS = ['RESTAURANT', 'HOTEL', 'CAFE', 'PIZZA', 'BURGER', 'BIRYANI', 'DOMINOS', 'MCDONALDS', 'KFC', 'SUBWAY', 'FOOD', 'ORDER'];
const FUEL_KEYWORDS = ['PETROL', 'PETROLEUM', 'DIESEL', 'FUEL', 'IOCL', 'BPCL', 'NAYARA', 'SHELL', 'HP PUMP', 'HINDUSTAN PETROLEUM', 'BHARAT PETROLEUM'];
const TOLL_KEYWORDS = ['FASTAG', 'TOLL', 'PLAZA', 'EXPRESSWAY', 'HIGHWAY'];
const TOLL_SENDERS = ['FASTAG', 'NETCFL', 'IHMCL'];
const MAINTENANCE_KEYWORDS = ['SERVICE CENTER', 'WORKSHOP', 'REPAIR', 'GARAGE', 'SERVICING', 'HONDA SERVICE', 'HERO SERVICE', 'MARUTI SERVICE'];
const RECHARGE_KEYWORDS = ['RECHARGE', 'PREPAID', 'VALIDITY', 'TALK TIME', 'DATA PACK', 'DATA/DAY'];
const RECHARGE_SENDERS = ['AIRTEL', 'JIOTEL', 'BSNLIN', 'VFINL'];
const PARKING_KEYWORDS = ['PARKING'];

/**
 * Extract the suffix from sender ID (e.g. "AX-HDFCBK" → "HDFCBK")
 */
function senderSuffix(senderUpper) {
    const idx = senderUpper.lastIndexOf('-');
    return idx !== -1 ? senderUpper.slice(idx + 1) : senderUpper;
}

function senderContains(senderUpper, list) {
    return list.some((id) => senderUpper.includes(id));
}

function bodyContains(upper, list) {
    return list.some((kw) => upper.includes(kw));
}

function determineCategory(senderUpper, upper, direction) {
    const suffix = senderSuffix(senderUpper);

    // INCOME — highest priority
    // Gig platform payout
    if (senderContains(senderUpper, GIG_PLATFORMS) && bodyContains(upper, INCOME_BODY_KEYWORDS)) {
        return 'INCOME';
    }
    // Salary / stipend
    if (upper.includes('SALARY') || upper.includes('STIPEND')) {
        return 'INCOME';
    }
    // Generic credit that's not food/fuel → INCOME
    if (direction === 'credit' && !bodyContains(upper, FOOD_KEYWORDS) && !bodyContains(upper, FUEL_KEYWORDS)) {
        // Check if it looks like a UPI credit or bank credit
        if (upper.includes('NEFT') || upper.includes('IMPS') || upper.includes('UPI')) {
            return 'INCOME';
        }
    }

    // FOOD — gig platform debit or food keywords
    if (senderContains(senderUpper, ['ZOMATO', 'SWIGGY']) && direction === 'debit') {
        return 'FOOD';
    }
    if (bodyContains(upper, FOOD_KEYWORDS) && direction === 'debit') {
        return 'FOOD';
    }

    // TOLL
    if (senderContains(senderUpper, TOLL_SENDERS) || bodyContains(upper, TOLL_KEYWORDS)) {
        return 'TOLL';
    }

    // FUEL
    if (bodyContains(upper, FUEL_KEYWORDS)) {
        return 'FUEL';
    }

    // MAINTENANCE
    if (bodyContains(upper, MAINTENANCE_KEYWORDS)) {
        return 'MAINTENANCE';
    }

    // MOBILE_RECHARGE
    if (senderContains(senderUpper, RECHARGE_SENDERS) || bodyContains(upper, RECHARGE_KEYWORDS)) {
        return 'MOBILE_RECHARGE';
    }

    // PARKING
    if (bodyContains(upper, PARKING_KEYWORDS)) {
        return 'PARKING';
    }

    // TRANSFER — UPI/bank transactions that didn't match above
    if (upper.includes('UPI') || upper.includes('NEFT') || upper.includes('IMPS') || upper.includes('RTGS')) {
        return 'TRANSFER';
    }

    return 'UNKNOWN';
}

// ── Merchant Extraction ────────────────────────────────────

const KNOWN_MERCHANTS = {
    ZOMATO: 'Zomato', SWIGGY: 'Swiggy', OLARIDE: 'Ola',
    UBERIND: 'Uber', DUNZOW: 'Dunzo', BLINKT: 'Blinkit',
    ZEPTON: 'Zepto', BIGBAS: 'BigBasket', RAPIDO: 'Rapido',
    PORTER: 'Porter', URBANC: 'Urban Company', FKQCOM: 'Flipkart Quick',
    AMZFLX: 'Amazon Flex', JIOMRT: 'JioMart Partner',
    HDFCBK: 'HDFC Bank', ICICIB: 'ICICI Bank',
    SBIINB: 'SBI', AXISBK: 'Axis Bank', KOTAKB: 'Kotak Bank',
    GPAY: 'Google Pay', PHONEPE: 'PhonePe', PYTMBN: 'Paytm',
    AIRTEL: 'Airtel', JIOTEL: 'Jio',
};

function extractMerchant(body, senderUpper) {
    const suffix = senderSuffix(senderUpper);

    // Known platform/bank
    if (KNOWN_MERCHANTS[suffix]) return KNOWN_MERCHANTS[suffix];

    // Check if any known merchant name appears in sender
    for (const [key, name] of Object.entries(KNOWN_MERCHANTS)) {
        if (senderUpper.includes(key)) return name;
    }

    // Try extracting from body: "at <merchant>", "to <merchant>", "from <merchant>"
    const merchantPatterns = [
        /(?:at|to|from|via)\s+([A-Z][A-Za-z0-9\s]{2,20}?)(?:\s*[.,;]|\s+(?:on|via|ref|upi|for|order))/i,
    ];

    for (const pattern of merchantPatterns) {
        const match = pattern.exec(body);
        if (match) {
            return match[1].trim();
        }
    }

    return null;
}

// ── Confidence Score ───────────────────────────────────────

function computeConfidence(amount, direction, category) {
    if (!amount || amount === 0) return 0.1;
    if (category === 'UNKNOWN') return 0.5;
    if (direction) return 0.95;
    return 0.7;
}

// ── Trips Count Extraction ─────────────────────────────────

function extractTripsCount(body) {
    // Patterns: "12 deliveries", "15 orders completed", "8 trips", "(12 deliveries)"
    const patterns = [
        /(\d+)\s*(?:deliver(?:y|ies))/i,
        /(\d+)\s*(?:order(?:s)?)\s*(?:completed|done)?/i,
        /(\d+)\s*(?:trip(?:s)?)\s*(?:completed|done)?/i,
        /(\d+)\s*(?:ride(?:s)?)\s*(?:completed|done)?/i,
    ];

    for (const pattern of patterns) {
        const match = body.match(pattern);
        if (match) {
            const count = parseInt(match[1], 10);
            if (count > 0 && count < 200) return count; // sanity check
        }
    }
    return null;
}

// ── Date Extraction from SMS Body ─────────────────────────

function extractDate(body) {
    const patterns = [
        // DD-MM-YY or DD/MM/YY or DD-MM-YYYY
        /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/,
        // 27 Feb 2026, 27 February 2026
        /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{2,4})/i,
        // Feb 27, 2026
        /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{2,4})/i,
    ];

    for (const pattern of patterns) {
        const match = body.match(pattern);
        if (match) {
            try {
                const parsed = new Date(match[0].replace(/\//g, '-'));
                if (!isNaN(parsed.getTime())) return parsed;
            } catch (_) { /* skip invalid */ }
        }
    }
    return null;
}

module.exports = { parseSms, extractDate };
// Export for testing: parseSms + extractDate are the main entry points
