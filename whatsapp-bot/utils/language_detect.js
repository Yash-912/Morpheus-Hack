// ============================================================
// Language Detect — detect EN/HI/mixed messages
// ============================================================

// Devanagari Unicode range: \u0900-\u097F
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
// Basic Latin script range
const LATIN_REGEX = /[a-zA-Z]/;

/**
 * Detect the primary language of a text message.
 * @param {string} text
 * @returns {'hi'|'en'|'mixed'}
 */
function detectLanguage(text) {
    if (!text || typeof text !== 'string') return 'en';

    const hasDevanagari = DEVANAGARI_REGEX.test(text);
    const hasLatin = LATIN_REGEX.test(text);

    if (hasDevanagari && hasLatin) return 'mixed';
    if (hasDevanagari) return 'hi';
    return 'en';
}

/**
 * Check if the message is primarily Hindi (Devanagari or Hinglish keywords).
 */
const HINGLISH_KEYWORDS = [
    'aaj', 'kal', 'kitna', 'bakiya', 'nikalo', 'kamaya', 'chahiye', 'kharcha',
    'kahaan', 'kaam', 'hai', 'mera', 'meri', 'udhaar', 'paise', 'bata',
];

function isHinglish(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return HINGLISH_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Get preferred language for response.
 * @param {string} text — incoming message text
 * @returns {'hi'|'en'}
 */
function getResponseLanguage(text) {
    const lang = detectLanguage(text);
    if (lang === 'hi') return 'hi';
    if (lang === 'mixed' || isHinglish(text)) return 'hi';
    return 'en';
}

module.exports = { detectLanguage, isHinglish, getResponseLanguage };
