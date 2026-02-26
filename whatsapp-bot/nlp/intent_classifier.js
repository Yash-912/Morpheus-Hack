// ============================================================
// Intent Classifier — rule-based regex + keyword matching
// 11 intents: CHECK_BALANCE, CASHOUT, CHECK_EARNINGS_TODAY,
//   GET_FORECAST, GET_HOT_ZONES, APPLY_LOAN, ACTIVATE_INSURANCE,
//   TAX_HELP, EXPENSE_SUMMARY, COMMUNITY_JOBS, HELP
// ============================================================

const INTENTS = {
    CHECK_BALANCE: {
        patterns: [
            /\bbalance\b/i,
            /\bbakiya\b/i,
            /\bkitna\b.*\bhai\b/i,
            /\bwallet\b/i,
            /\bpaise\s*(kitne|hai|bache)\b/i,
            /how much.*\b(left|available|balance)\b/i,
        ],
        examples: ['balance', 'bakiya kitna hai', 'wallet balance', 'how much left'],
    },

    CASHOUT: {
        patterns: [
            /\bcashout\b/i,
            /\bwithdraw\b/i,
            /\bnikalo\b/i,
            /\bnikalwana\b/i,
            /\bpaise\s*nikal/i,
            /\btransfer\b.*\b(money|paise)\b/i,
            /\bcash\s*out\b/i,
        ],
        examples: ['cashout 500', 'withdraw 1000', 'nikalo 500', 'paise nikal'],
    },

    CHECK_EARNINGS_TODAY: {
        patterns: [
            /\bearnings?\b/i,
            /\bkamai\b/i,
            /\bkamaya\b/i,
            /\baaj\b.*\bkitna\b/i,
            /\btoday\b.*\b(earn|income|made)\b/i,
            /\bhow much.*\b(earn|today|made)\b/i,
            /\bincome\b/i,
        ],
        examples: ['earnings', 'aaj ki kamai', 'how much did I earn today', 'today income'],
    },

    GET_FORECAST: {
        patterns: [
            /\bforecast\b/i,
            /\bpredict\b/i,
            /\bkal\b.*\b(kitna|earn|kamai)\b/i,
            /\btomorrow\b.*\b(earn|predict|forecast|expect)\b/i,
            /\bkal\b.*\bkamaai\b/i,
            /\bexpected\b.*\bearnings?\b/i,
        ],
        examples: ['forecast', 'kal kitna kamai', 'predict tomorrow earnings', 'expected income'],
    },

    GET_HOT_ZONES: {
        patterns: [
            /\bzone[s]?\b/i,
            /\bhot\s*zone\b/i,
            /\bkahaan\b/i,
            /\bwhere.*\bgo\b/i,
            /\bwhere.*\bdeliver\b/i,
            /\bbest\s*(area|place|loc)\b/i,
            /\bheatmap\b/i,
            /\bdemand\b.*\barea\b/i,
        ],
        examples: ['zones', 'hot zones', 'kahaan jaun', 'where to deliver', 'best area'],
    },

    APPLY_LOAN: {
        patterns: [
            /\bloan\b/i,
            /\budhaar\b/i,
            /\bpaise\s*chahiye\b/i,
            /\bemergency\b.*\b(money|paise|cash)\b/i,
            /\bborrow\b/i,
            /\bcredit\b/i,
        ],
        examples: ['loan', 'udhaar', 'paise chahiye', 'emergency money', 'loan 2000'],
    },

    ACTIVATE_INSURANCE: {
        patterns: [
            /\binsur(e|ance)\b/i,
            /\binsure\b/i,
            /\bbima\b/i,
            /\bprotect\b/i,
            /\baccident\b.*\b(cover|protection)\b/i,
            /\bhealth\b.*\b(cover|plan)\b/i,
        ],
        examples: ['insurance', 'bima', 'insure me', 'accident protection'],
    },

    TAX_HELP: {
        patterns: [
            /\btax\b/i,
            /\bitr\b/i,
            /\bdeduction\b/i,
            /\bfiling\b/i,
            /\b(tcs|tds)\b/i,
            /\bcleartax\b/i,
        ],
        examples: ['tax', 'ITR filing', 'tax deductions', 'how much tax'],
    },

    EXPENSE_SUMMARY: {
        patterns: [
            /\bexpenses?\b/i,
            /\bkharcha\b/i,
            /\bspend\b/i,
            /\bfuel\b.*\b(cost|expense)\b/i,
            /\bmonthly\b.*\b(expense|spend)\b/i,
            /\bhow much.*\bspend\b/i,
        ],
        examples: ['expenses', 'kharche', 'monthly spend', 'fuel expense'],
    },

    COMMUNITY_JOBS: {
        patterns: [
            /\bjobs?\b/i,
            /\bkaam\b/i,
            /\bnear\s*me\b/i,
            /\bdelivery.*(job|work|kaam)\b/i,
            /\bfreelance\b/i,
            /\bcommunity\b/i,
            /\bgig\b.*\bjob\b/i,
        ],
        examples: ['jobs near me', 'kaam chahiye', 'community jobs', 'delivery work'],
    },

    HELP: {
        patterns: [/\bhelp\b/i, /\bmenu\b/i, /\bwhat can you do\b/i, /\bcommands?\b/i, /^hi$/i, /^hello$/i, /^hey$/i],
        examples: ['help', 'menu', 'what can you do', 'commands'],
    },
};

/**
 * Classify a message into one of 11 intents.
 * @param {string} text
 * @returns {{ intent: string, confidence: number, entities: object }}
 */
function classifyIntent(text) {
    if (!text || typeof text !== 'string') {
        return { intent: 'HELP', confidence: 0.5, entities: {} };
    }

    const normalized = text.trim().toLowerCase();

    for (const [intentName, intentDef] of Object.entries(INTENTS)) {
        for (const pattern of intentDef.patterns) {
            if (pattern.test(normalized)) {
                const entities = extractEntities(normalized, intentName);
                return { intent: intentName, confidence: 0.9, entities };
            }
        }
    }

    return { intent: 'UNKNOWN', confidence: 0.0, entities: {} };
}

/**
 * Extract entities from text based on intent.
 */
function extractEntities(text, intent) {
    const entities = {};

    // Amount extraction: ₹500, Rs 500, 500, 1000
    const amountMatch = text.match(/(?:₹|rs\.?\s*|inr\s*)?(\d+(?:,\d+)*(?:\.\d{1,2})?)/i);
    if (amountMatch) {
        const raw = amountMatch[1].replace(/,/g, '');
        const rupees = parseFloat(raw);
        if (!isNaN(rupees) && rupees > 0) {
            // Store in paise (integer)
            entities.amount = Math.round(rupees * 100);
            entities.amountRupees = rupees;
        }
    }

    // Insurance plan number
    if (intent === 'ACTIVATE_INSURANCE') {
        const planMatch = text.match(/insure\s+(\d+)/i);
        if (planMatch) entities.planIndex = parseInt(planMatch[1], 10) - 1;
    }

    // Platform (zomato, swiggy, ola, uber, dunzo)
    const platformMatch = text.match(/\b(zomato|swiggy|ola|uber|dunzo|rapido)\b/i);
    if (platformMatch) entities.platform = platformMatch[1].toLowerCase();

    return entities;
}

module.exports = { classifyIntent, INTENTS, extractEntities };
