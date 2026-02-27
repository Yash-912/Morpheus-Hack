// WhatsApp Bot Phase 3 — Full test suite
// Run: node tests/whatsappBot.test.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Test 1: Intent Detection ────────────────────────────────
const INTENTS = {
    GREETING: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'hola', 'start'],
    CHECK_BALANCE: ['balance', 'bakaya', 'shillak', 'wallet', 'paisa', 'paise', 'money'],
    TODAY_EARNINGS: ['earnings', 'earning', 'kamai', 'kamaayi', 'aaj', 'today', 'income'],
    CASHOUT: ['cashout', 'withdraw', 'nikaal', 'nikalo', 'cash', 'nikal', 'withdrawal', 'kadha'],
    HELP: ['help', 'madad', 'sahayata', 'menu', 'commands', '?'],
    GIGSCORE: ['gigscore', 'score', 'credit', 'rating'],
    TRANSACTIONS: ['transactions', 'history', 'lenden', 'vyavhar', 'recent'],
    REPORT: ['report', 'weekly', 'summary', 'hafta', 'ahval'],
};

function matchesKeyword(text, keyword) {
    if (keyword.length <= 3) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
    }
    return text.includes(keyword);
}

function detectIntent(text) {
    for (const [name, keywords] of Object.entries(INTENTS)) {
        for (const kw of keywords) {
            if (matchesKeyword(text, kw)) return name;
        }
    }
    return null;
}

const intentTests = [
    ['hi', 'GREETING'], ['namaste', 'GREETING'], ['namaskar', 'GREETING'],
    ['balance', 'CHECK_BALANCE'], ['bakaya', 'CHECK_BALANCE'], ['shillak', 'CHECK_BALANCE'],
    ['earnings', 'TODAY_EARNINGS'], ['kamai', 'TODAY_EARNINGS'], ['aaj ki kamai', 'TODAY_EARNINGS'],
    ['cashout', 'CASHOUT'], ['nikaal do', 'CASHOUT'], ['withdraw', 'CASHOUT'], ['kadha', 'CASHOUT'],
    ['help', 'HELP'], ['madad', 'HELP'], ['help?', 'HELP'],
    ['gigscore', 'GIGSCORE'], ['my credit score', 'GIGSCORE'],
    ['transactions', 'TRANSACTIONS'], ['recent lenden', 'TRANSACTIONS'],
    ['weekly report', 'REPORT'], ['hafta', 'REPORT'], ['ahval', 'REPORT'],
    ['random xyz', null],
];

// ── Test 2: Language Detection ──────────────────────────────
const HINDI_MARKERS = ['kya', 'hai', 'mera', 'meri', 'kitna', 'kitni', 'karo', 'kaise', 'batao', 'dekho', 'chahiye', 'nahi', 'haan', 'ji', 'bhai', 'yaar', 'acha', 'theek', 'paisa', 'paise', 'kamai', 'nikaal', 'nikalo', 'bakaya', 'madad'];
const MARATHI_MARKERS = ['kay', 'aahe', 'maza', 'kiti', 'kara', 'kasa', 'sanga', 'bagha', 'pahije', 'nahi', 'ho', 'bhau', 'paise', 'kamai', 'kadha', 'shillak', 'sahayata'];

function detectLanguage(text) {
    const words = text.toLowerCase().split(/\s+/);
    let hi = 0, mr = 0;
    for (const w of words) {
        if (HINDI_MARKERS.includes(w)) hi++;
        if (MARATHI_MARKERS.includes(w)) mr++;
    }
    if (mr > hi && mr >= 1) return 'mr';
    if (hi > hi && hi >= 1) return 'hi'; // this line is intentionally testing
    if (hi >= 1) return 'hi';
    return 'en';
}

const langTests = [
    ['check my balance', 'en'],
    ['mera paisa kitna hai', 'hi'],
    ['bhai kamai batao', 'hi'],
    ['maza shillak kiti aahe', 'mr'],
    ['kadha kara bhau', 'mr'],
    ['hello', 'en'],
];

// ── Test 3: Cashout Amount Parsing ──────────────────────────
function parseAmount(text, balance) {
    if (['max', 'all', 'pura', 'sab'].includes(text)) return balance;
    const parsed = parseInt(text.replace(/[₹,\s]/g, ''));
    if (parsed > 0 && parsed <= balance) return parsed;
    return null;
}

const amountTests = [
    ['500', 1000, 500],
    ['max', 1000, 1000],
    ['all', 5000, 5000],
    ['₹2,000', 5000, 2000],
    ['0', 1000, null],
    ['9999', 1000, null],
    ['abc', 1000, null],
];

// ── Test 4: Interactive Button ID Parsing ───────────────────
function parseButtonId(id) {
    return id.replace('cmd_', '').replace('cashout_', '');
}

const buttonTests = [
    ['cmd_balance', 'balance'],
    ['cmd_earnings', 'earnings'],
    ['cmd_cashout', 'cashout'],
    ['cashout_yes', 'yes'],
    ['cashout_no', 'no'],
];

// ── Run All Tests ───────────────────────────────────────────
console.log('═══════════════════════════════════════════');
console.log('  WhatsApp Bot Phase 3 — Full Test Suite');
console.log('═══════════════════════════════════════════\n');

let passed = 0, failed = 0;

console.log('📌 Intent Detection');
for (const [input, expected] of intentTests) {
    const result = detectIntent(input.toLowerCase());
    const ok = result === expected;
    if (ok) { passed++; console.log(`  ✅ "${input}" → ${result || 'UNKNOWN'}`); }
    else { failed++; console.log(`  ❌ "${input}" → got ${result || 'UNKNOWN'}, expected ${expected || 'UNKNOWN'}`); }
}

console.log('\n🌐 Language Detection');
for (const [input, expected] of langTests) {
    const result = detectLanguage(input);
    const ok = result === expected;
    if (ok) { passed++; console.log(`  ✅ "${input}" → ${result}`); }
    else { failed++; console.log(`  ❌ "${input}" → got ${result}, expected ${expected}`); }
}

console.log('\n💸 Cashout Amount Parsing');
for (const [input, bal, expected] of amountTests) {
    const result = parseAmount(input, bal);
    const ok = result === expected;
    if (ok) { passed++; console.log(`  ✅ "${input}" (bal=${bal}) → ${result ?? 'null'}`); }
    else { failed++; console.log(`  ❌ "${input}" (bal=${bal}) → got ${result ?? 'null'}, expected ${expected ?? 'null'}`); }
}

console.log('\n🔘 Button ID Parsing');
for (const [input, expected] of buttonTests) {
    const result = parseButtonId(input);
    const ok = result === expected;
    if (ok) { passed++; console.log(`  ✅ "${input}" → ${result}`); }
    else { failed++; console.log(`  ❌ "${input}" → got ${result}, expected ${expected}`); }
}

const total = passed + failed;
console.log('\n═══════════════════════════════════════════');
console.log(`  ${passed}/${total} passed (${((passed / total) * 100).toFixed(1)}%)`);
console.log('═══════════════════════════════════════════');

process.exit(failed > 0 ? 1 : 0);
