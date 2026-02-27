// ============================================================
// WhatsApp Bot — Intent-based conversation handler (Phase 3)
// Supports: interactive messages, cashout flow, language
//           detection, session memory, weekly reports
// ============================================================

const { prisma } = require('../config/database');
const WhatsAppService = require('./whatsapp.service');
const logger = require('../utils/logger.utils');

// ── In-memory session store (phone → session) ───────────────
// In production, use Redis. For hackathon, in-memory is fine.
const sessions = new Map();
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSession(phone) {
    const s = sessions.get(phone);
    if (s && Date.now() - s.lastActivity < SESSION_TTL_MS) {
        s.lastActivity = Date.now();
        return s;
    }
    const fresh = { state: 'IDLE', data: {}, lang: null, lastActivity: Date.now() };
    sessions.set(phone, fresh);
    return fresh;
}

function clearSession(phone) {
    sessions.delete(phone);
}

// ── Language detection ───────────────────────────────────────
const HINDI_MARKERS = ['kya', 'hai', 'mera', 'meri', 'kitna', 'kitni', 'karo', 'kaise', 'batao', 'dekho', 'chahiye', 'nahi', 'haan', 'ji', 'bhai', 'yaar', 'acha', 'theek', 'paisa', 'paise', 'kamai', 'nikaal', 'nikalo', 'bakaya', 'madad', 'bhej', 'bhejo', 'ruk', 'aur', 'aaj', 'kal'];
const MARATHI_MARKERS = ['kay', 'aahe', 'maza', 'kiti', 'kara', 'kasa', 'sanga', 'bagha', 'pahije', 'nahi', 'ho', 'bhau', 'paise', 'kamai', 'kadha', 'shillak', 'sahayata', 'pathva', 'thamba', 'aani', 'aaj', 'udya'];

function detectLanguage(text) {
    const words = text.toLowerCase().split(/\s+/);
    let hiScore = 0;
    let mrScore = 0;
    for (const w of words) {
        if (HINDI_MARKERS.includes(w)) hiScore++;
        if (MARATHI_MARKERS.includes(w)) mrScore++;
    }
    if (mrScore > hiScore && mrScore >= 1) return 'mr';
    if (hiScore > mrScore && hiScore >= 1) return 'hi';
    return 'en';
}

// ── Multilingual response templates ──────────────────────────
const STRINGS = {
    en: {
        greeting: (name) => `🙏 Namaste ${name}!\n\nI'm your *GigPay Assistant* on WhatsApp.`,
        menuPrompt: `What would you like to do?`,
        balance: (bal, lifetime) => `💰 *Wallet Balance*\n\nAvailable: *₹${bal}*\nLifetime Earned: ₹${lifetime}`,
        balanceAction: `Type *cashout* to withdraw.`,
        noEarnings: `📊 *Today's Earnings*\n\nNo earnings recorded yet today.\nKeep going — your next gig is around the corner! 💪`,
        earningsHeader: (total, count) => `📊 *Today's Earnings*\n\nTotal: *₹${total}*\nOrders/Trips: ${count}`,
        platformBreakdown: `📱 *Platform Breakdown:*`,
        cashoutZero: `💸 *Cashout*\n\nYour wallet balance is ₹0.\nComplete some gigs to earn money first! 🏃`,
        cashoutAvailable: (bal) => `💸 *Cashout Available*\n\nWallet Balance: *₹${bal}*\nClears in: ~60 seconds ⚡`,
        cashoutAskAmount: (bal) => `How much would you like to withdraw?\n\nAvailable: ₹${bal}\nReply with an amount (e.g., *500*) or type *max* for full balance.`,
        cashoutConfirm: (amount) => `You're about to withdraw *₹${amount}*.\n\nPlatform fee: ₹0 (free!) ✨\nYou'll receive: *₹${amount}*\nArrival: ~60 seconds`,
        cashoutSuccess: (amount) => `✅ *Withdrawal Successful!*\n\n₹${amount} is being sent to your bank account.\nExpected arrival: ~60 seconds 🎉`,
        cashoutFailed: `❌ Withdrawal failed. Please try again from the GigPay app.`,
        cashoutCancelled: `Withdrawal cancelled. Your money is safe in your wallet. 👍`,
        invalidAmount: (bal) => `Please enter a valid amount between ₹1 and ₹${bal}.`,
        gigscore: (score, cat) => `⭐ *Your GigScore*\n\nScore: *${score}/1000*\nCategory: ${cat}\n\nA higher GigScore unlocks better loan rates! 📈`,
        gigscoreEmpty: `⭐ *GigScore*\n\nYour GigScore hasn't been calculated yet.\nLink your platforms to get scored! 🎯`,
        transactionsEmpty: `📋 *Recent Transactions*\n\nNo transactions found.\nSync your SMS in the GigPay app! 📲`,
        transactionsHeader: `📋 *Last 5 Transactions*\n`,
        help: `❓ *GigPay Bot Commands*\n\nType any of these:\n\n💰 *balance* — Wallet balance\n📊 *earnings* — Today's earnings\n💸 *cashout* — Withdraw money\n📋 *transactions* — Recent history\n⭐ *gigscore* — Credit score\n👋 *hi* — Greeting\n\n_Works in English, Hindi & Marathi!_ 🇮🇳`,
        unknown: (text) => `🤔 I didn't understand "${text.substring(0, 50)}".\n\nType *help* to see available commands.`,
        unregistered: `🙏 Namaste! I couldn't find a GigPay account linked to this number.\n\nPlease register on the GigPay app first, then come back here!\n\n📱 Download: gigpay.app`,
        weeklyHeader: `📊 *Weekly Earnings Report*\n`,
        weeklyNoData: `No earnings data for this week yet.`,
    },
    hi: {
        greeting: (name) => `🙏 नमस्ते ${name}!\n\nमैं आपका *GigPay सहायक* हूँ WhatsApp पर।`,
        menuPrompt: `आप क्या करना चाहेंगे?`,
        balance: (bal, lifetime) => `💰 *वॉलेट बैलेंस*\n\nउपलब्ध: *₹${bal}*\nकुल कमाई: ₹${lifetime}`,
        balanceAction: `निकासी के लिए *cashout* टाइप करें।`,
        noEarnings: `📊 *आज की कमाई*\n\nआज अभी तक कोई कमाई नहीं।\nहिम्मत रखो — अगला गिग आने वाला है! 💪`,
        earningsHeader: (total, count) => `📊 *आज की कमाई*\n\nकुल: *₹${total}*\nऑर्डर/ट्रिप: ${count}`,
        platformBreakdown: `📱 *प्लेटफॉर्म विवरण:*`,
        cashoutZero: `💸 *निकासी*\n\nआपका वॉलेट बैलेंस ₹0 है।\nपहले कुछ गिग पूरी करें! 🏃`,
        cashoutAvailable: (bal) => `💸 *निकासी उपलब्ध*\n\nवॉलेट बैलेंस: *₹${bal}*\n~60 सेकंड में पहुँचेगा ⚡`,
        cashoutAskAmount: (bal) => `कितना निकालना चाहेंगे?\n\nउपलब्ध: ₹${bal}\nराशि बताएं (जैसे *500*) या पूरी राशि के लिए *max* टाइप करें।`,
        cashoutConfirm: (amount) => `आप *₹${amount}* निकालने वाले हैं।\n\nप्लेटफॉर्म शुल्क: ₹0 (मुफ़्त!) ✨\nआपको मिलेगा: *₹${amount}*\nआगमन: ~60 सेकंड`,
        cashoutSuccess: (amount) => `✅ *निकासी सफल!*\n\n₹${amount} आपके बैंक खाते में भेज दिया गया।\nअनुमानित आगमन: ~60 सेकंड 🎉`,
        cashoutFailed: `❌ निकासी विफल। कृपया GigPay ऐप से पुनः प्रयास करें।`,
        cashoutCancelled: `निकासी रद्द। आपके पैसे वॉलेट में सुरक्षित हैं। 👍`,
        invalidAmount: (bal) => `कृपया ₹1 से ₹${bal} के बीच एक वैध राशि दर्ज करें।`,
        gigscore: (score, cat) => `⭐ *आपका गिगस्कोर*\n\nस्कोर: *${score}/1000*\nश्रेणी: ${cat}\n\nऊँचा गिगस्कोर = बेहतर ऋण दरें! 📈`,
        gigscoreEmpty: `⭐ *गिगस्कोर*\n\nआपका गिगस्कोर अभी तैयार नहीं हुआ।\nप्लेटफॉर्म जोड़ें और गिग पूरी करें! 🎯`,
        transactionsEmpty: `📋 *हाल के लेनदेन*\n\nकोई लेनदेन नहीं मिला।\nGigPay ऐप में SMS सिंक करें! 📲`,
        transactionsHeader: `📋 *पिछले 5 लेनदेन*\n`,
        help: `❓ *GigPay बॉट कमांड*\n\nये टाइप करें:\n\n💰 *balance / bakaya* — वॉलेट बैलेंस\n📊 *earnings / kamai* — आज की कमाई\n💸 *cashout / nikaal* — पैसे निकालें\n📋 *transactions / lenden* — हाल के लेनदेन\n⭐ *gigscore* — क्रेडिट स्कोर\n👋 *hi / namaste* — अभिवादन\n\n_हिंदी, मराठी और अंग्रेज़ी में काम करता है!_ 🇮🇳`,
        unknown: (text) => `🤔 मुझे "${text.substring(0, 50)}" समझ नहीं आया।\n\nकमांड देखने के लिए *help* टाइप करें।`,
        unregistered: `🙏 नमस्ते! इस नंबर से कोई GigPay खाता नहीं मिला।\n\nकृपया पहले GigPay ऐप पर रजिस्टर करें!\n\n📱 डाउनलोड: gigpay.app`,
        weeklyHeader: `📊 *साप्ताहिक कमाई रिपोर्ट*\n`,
        weeklyNoData: `इस हफ़्ते अभी तक कोई कमाई डेटा नहीं।`,
    },
    mr: {
        greeting: (name) => `🙏 नमस्कार ${name}!\n\nमी तुमचा *GigPay सहाय्यक* आहे WhatsApp वर.`,
        menuPrompt: `तुम्हाला काय करायचे आहे?`,
        balance: (bal, lifetime) => `💰 *वॉलेट शिल्लक*\n\nउपलब्ध: *₹${bal}*\nएकूण कमाई: ₹${lifetime}`,
        balanceAction: `काढण्यासाठी *cashout* टाइप करा.`,
        noEarnings: `📊 *आजची कमाई*\n\nआज अजून कमाई नाही.\nहिम्मत ठेवा — पुढची गिग येणार! 💪`,
        earningsHeader: (total, count) => `📊 *आजची कमाई*\n\nएकूण: *₹${total}*\nऑर्डर/ट्रिप: ${count}`,
        platformBreakdown: `📱 *प्लॅटफॉर्म विवरण:*`,
        cashoutZero: `💸 *काढणे*\n\nतुमची वॉलेट शिल्लक ₹0 आहे.\nआधी काही गिग्स पूर्ण करा! 🏃`,
        cashoutAvailable: (bal) => `💸 *काढणे उपलब्ध*\n\nवॉलेट शिल्लक: *₹${bal}*\n~60 सेकंदात पोहोचेल ⚡`,
        cashoutAskAmount: (bal) => `किती काढायचे?\n\nउपलब्ध: ₹${bal}\nरक्कम सांगा (जसे *500*) किंवा *max* टाइप करा.`,
        cashoutConfirm: (amount) => `तुम्ही *₹${amount}* काढणार आहात.\n\nप्लॅटफॉर्म शुल्क: ₹0 (मोफत!) ✨\nतुम्हाला मिळेल: *₹${amount}*\nआगमन: ~60 सेकंद`,
        cashoutSuccess: (amount) => `✅ *काढणे यशस्वी!*\n\n₹${amount} तुमच्या बँक खात्यात पाठवले.\nअंदाजे आगमन: ~60 सेकंद 🎉`,
        cashoutFailed: `❌ काढणे अयशस्वी. कृपया GigPay ॲपमधून पुन्हा प्रयत्न करा.`,
        cashoutCancelled: `काढणे रद्द. तुमचे पैसे वॉलेटमध्ये सुरक्षित आहेत. 👍`,
        invalidAmount: (bal) => `कृपया ₹1 ते ₹${bal} दरम्यान वैध रक्कम टाका.`,
        gigscore: (score, cat) => `⭐ *तुमचा गिगस्कोर*\n\nस्कोर: *${score}/1000*\nश्रेणी: ${cat}\n\nउच्च गिगस्कोर = चांगले कर्ज दर! 📈`,
        gigscoreEmpty: `⭐ *गिगस्कोर*\n\nतुमचा गिगस्कोर अजून तयार नाही.\nप्लॅटफॉर्म जोडा आणि गिग्स पूर्ण करा! 🎯`,
        transactionsEmpty: `📋 *अलीकडील व्यवहार*\n\nकोणतेही व्यवहार नाहीत.\nGigPay ॲपमध्ये SMS सिंक करा! 📲`,
        transactionsHeader: `📋 *शेवटचे 5 व्यवहार*\n`,
        help: `❓ *GigPay बॉट कमांड*\n\nहे टाइप करा:\n\n💰 *balance / shillak* — वॉलेट शिल्लक\n📊 *earnings / kamai* — आजची कमाई\n💸 *cashout / kadha* — पैसे काढा\n📋 *transactions / vyavhar* — अलीकडील\n⭐ *gigscore* — क्रेडिट स्कोर\n👋 *hi / namaskar* — अभिवादन\n\n_हिंदी, मराठी आणि इंग्रजीत काम करते!_ 🇮🇳`,
        unknown: (text) => `🤔 मला "${text.substring(0, 50)}" समजले नाही.\n\nकमांड पाहण्यासाठी *help* टाइप करा.`,
        unregistered: `🙏 नमस्कार! या नंबरवर कोणतेही GigPay खाते नाही.\n\nकृपया आधी GigPay ॲपवर नोंदणी करा!\n\n📱 डाउनलोड: gigpay.app`,
        weeklyHeader: `📊 *साप्ताहिक कमाई अहवाल*\n`,
        weeklyNoData: `या आठवड्यात अजून कमाई डेटा नाही.`,
    },
};

function t(lang, key, ...args) {
    const fn = STRINGS[lang]?.[key] || STRINGS.en[key];
    return typeof fn === 'function' ? fn(...args) : fn;
}

// ── Intent keywords ──────────────────────────────────────────
const INTENTS = {
    GREETING: {
        keywords: ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'hola', 'start'],
        handler: handleGreeting,
    },
    CHECK_BALANCE: {
        keywords: ['balance', 'bakaya', 'shillak', 'wallet', 'paisa', 'paise', 'money'],
        handler: handleBalance,
    },
    TODAY_EARNINGS: {
        keywords: ['earnings', 'earning', 'kamai', 'kamaayi', 'aaj', 'today', 'income'],
        handler: handleEarnings,
    },
    CASHOUT: {
        keywords: ['cashout', 'withdraw', 'nikaal', 'nikalo', 'cash', 'nikal', 'withdrawal', 'kadha'],
        handler: handleCashout,
    },
    HELP: {
        keywords: ['help', 'madad', 'sahayata', 'menu', 'commands', '?'],
        handler: handleHelp,
    },
    GIGSCORE: {
        keywords: ['gigscore', 'score', 'credit', 'rating'],
        handler: handleGigScore,
    },
    TRANSACTIONS: {
        keywords: ['transactions', 'history', 'lenden', 'vyavhar', 'recent'],
        handler: handleTransactions,
    },
    REPORT: {
        keywords: ['report', 'weekly', 'summary', 'hafta', 'ahval'],
        handler: handleWeeklyReport,
    },
};

// ── Main entry point ─────────────────────────────────────────
const WhatsAppBot = {
    async handleMessage(phone, body) {
        const normalizedPhone = normalizePhone(phone);
        const text = body.trim().toLowerCase();
        const session = getSession(phone);

        // Auto-detect language if not set
        if (!session.lang) {
            session.lang = detectLanguage(text);
        }
        const lang = session.lang;

        // ── Handle active session states (multi-step flows) ──
        if (session.state === 'CASHOUT_AMOUNT') {
            return await handleCashoutAmount(phone, normalizedPhone, text, session, lang);
        }
        if (session.state === 'CASHOUT_CONFIRM') {
            return await handleCashoutConfirm(phone, normalizedPhone, text, session, lang);
        }

        // Cancel command works in any state
        if (['cancel', 'ruk', 'thamba', 'nahi', 'no'].includes(text)) {
            clearSession(phone);
            await reply(phone, t(lang, 'cashoutCancelled'));
            return;
        }

        // Look up user
        const user = await findUserByPhone(normalizedPhone);
        if (!user && !['GREETING', 'HELP'].includes(detectIntentName(text))) {
            await reply(phone, t(lang, 'unregistered'));
            return;
        }

        // Detect language from each message to adapt
        const msgLang = detectLanguage(text);
        if (msgLang !== 'en') session.lang = msgLang;

        // Detect intent
        const intent = detectIntent(text);
        if (intent) {
            await intent.handler(phone, user, text, session);
        } else {
            await handleUnknown(phone, user, text, session);
        }
    },

    /**
     * Generate and send weekly earnings report for a user.
     * Can be called from a cron job or scheduler.
     */
    async sendWeeklyReport(userId) {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.phone) return;
            const phone = user.phone.startsWith('+') ? user.phone : '+' + user.phone;
            const session = getSession(phone);
            await handleWeeklyReport(phone, user, '', session);
        } catch (err) {
            logger.error('Failed to send weekly report:', err);
        }
    },
};

// ── Intent detection ─────────────────────────────────────────
function matchesKeyword(text, keyword) {
    // For short keywords (hi, hey, aaj, etc), require word boundary
    // For longer keywords, substring match is fine
    if (keyword.length <= 3) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
    }
    return text.includes(keyword);
}

function detectIntent(text) {
    for (const [, config] of Object.entries(INTENTS)) {
        for (const keyword of config.keywords) {
            if (matchesKeyword(text, keyword)) return config;
        }
    }
    return null;
}

function detectIntentName(text) {
    for (const [name, config] of Object.entries(INTENTS)) {
        for (const keyword of config.keywords) {
            if (matchesKeyword(text, keyword)) return name;
        }
    }
    return null;
}

// ── Intent handlers ──────────────────────────────────────────

async function handleGreeting(phone, user, text, session) {
    const lang = session.lang || 'en';
    const name = user?.name || 'Partner';

    // Send greeting + interactive list menu
    await WhatsAppService.sendInteractiveList(
        formatPhone(phone),
        t(lang, 'greeting', name) + '\n\n' + t(lang, 'menuPrompt'),
        '📋 Menu',
        [
            {
                title: '💰 Finance',
                rows: [
                    { id: 'cmd_balance', title: '💰 Balance', description: 'Check wallet balance' },
                    { id: 'cmd_earnings', title: '📊 Earnings', description: "Today's earnings" },
                    { id: 'cmd_cashout', title: '💸 Cashout', description: 'Withdraw money' },
                ],
            },
            {
                title: '📋 Info',
                rows: [
                    { id: 'cmd_transactions', title: '📋 Transactions', description: 'Recent history' },
                    { id: 'cmd_gigscore', title: '⭐ GigScore', description: 'Credit score' },
                    { id: 'cmd_report', title: '📊 Weekly Report', description: 'This week summary' },
                ],
            },
        ]
    );
}

async function handleBalance(phone, user, text, session) {
    const lang = session.lang || 'en';
    const bal = Number(user.walletBalance || 0).toLocaleString('en-IN');
    const lifetime = Number(user.walletLifetimeEarned || 0).toLocaleString('en-IN');

    await WhatsAppService.sendInteractiveButtons(
        formatPhone(phone),
        t(lang, 'balance', bal, lifetime),
        [
            { id: 'cmd_cashout', title: '💸 Cashout' },
            { id: 'cmd_earnings', title: '📊 Earnings' },
            { id: 'cmd_help', title: '❓ Help' },
        ]
    );
}

async function handleEarnings(phone, user, text, session) {
    const lang = session.lang || 'en';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const earnings = await prisma.earning.findMany({
            where: { userId: user.id, date: { gte: today, lt: tomorrow } },
        });

        const totalAmount = earnings.reduce((sum, e) => sum + Number(e.netAmount || 0), 0);
        const count = earnings.length;

        if (count === 0) {
            await reply(phone, t(lang, 'noEarnings'));
            return;
        }

        // Group by platform
        const byPlatform = {};
        for (const e of earnings) {
            const p = e.platform || 'other';
            byPlatform[p] = (byPlatform[p] || 0) + Number(e.netAmount || 0);
        }

        let breakdown = '';
        for (const [platform, amount] of Object.entries(byPlatform)) {
            breakdown += `  • ${capitalize(platform)}: ₹${amount.toLocaleString('en-IN')}\n`;
        }

        await reply(phone,
            t(lang, 'earningsHeader', totalAmount.toLocaleString('en-IN'), count) +
            `\n\n${t(lang, 'platformBreakdown')}\n${breakdown}\n🎉`
        );
    } catch (err) {
        logger.error('WhatsApp earnings query failed:', err);
        await reply(phone, `⚠️ Error fetching earnings. Try again.`);
    }
}

// ── Cashout flow (multi-step with session memory) ────────────

async function handleCashout(phone, user, text, session) {
    const lang = session.lang || 'en';
    const bal = Number(user.walletBalance || 0);

    if (bal <= 0) {
        await reply(phone, t(lang, 'cashoutZero'));
        return;
    }

    // Check if amount is in the same message: "cashout 500"
    const amountMatch = text.match(/(?:cashout|withdraw|nikaal|nikalo|kadha)\s+(\d+)/);
    if (amountMatch) {
        const amount = parseInt(amountMatch[1]);
        if (amount > 0 && amount <= bal) {
            session.state = 'CASHOUT_CONFIRM';
            session.data = { amount, userId: user.id };
            await WhatsAppService.sendInteractiveButtons(
                formatPhone(phone),
                t(lang, 'cashoutConfirm', amount.toLocaleString('en-IN')),
                [
                    { id: 'cashout_yes', title: '✅ Confirm' },
                    { id: 'cashout_no', title: '❌ Cancel' },
                ]
            );
            return;
        }
    }

    // Ask for amount
    session.state = 'CASHOUT_AMOUNT';
    session.data = { userId: user.id, balance: bal };
    await reply(phone,
        t(lang, 'cashoutAvailable', bal.toLocaleString('en-IN')) + '\n\n' +
        t(lang, 'cashoutAskAmount', bal.toLocaleString('en-IN'))
    );
}

async function handleCashoutAmount(phone, normalizedPhone, text, session, lang) {
    const bal = session.data.balance || 0;
    let amount;

    if (text === 'max' || text === 'all' || text === 'pura' || text === 'sab') {
        amount = bal;
    } else if (['cancel', 'ruk', 'thamba', 'nahi', 'no'].includes(text)) {
        clearSession(phone);
        await reply(phone, t(lang, 'cashoutCancelled'));
        return;
    } else {
        amount = parseInt(text.replace(/[₹,\s]/g, ''));
    }

    if (!amount || amount <= 0 || amount > bal) {
        await reply(phone, t(lang, 'invalidAmount', bal.toLocaleString('en-IN')));
        return;
    }

    session.state = 'CASHOUT_CONFIRM';
    session.data.amount = amount;

    await WhatsAppService.sendInteractiveButtons(
        formatPhone(phone),
        t(lang, 'cashoutConfirm', amount.toLocaleString('en-IN')),
        [
            { id: 'cashout_yes', title: '✅ Confirm' },
            { id: 'cashout_no', title: '❌ Cancel' },
        ]
    );
}

async function handleCashoutConfirm(phone, normalizedPhone, text, session, lang) {
    const { amount, userId } = session.data;

    if (['yes', 'confirm', 'haan', 'ha', 'ho', '1', '✅'].includes(text) || text.includes('confirm')) {
        try {
            // Execute the cashout
            await prisma.$transaction(async (tx) => {
                // Deduct from wallet
                await tx.user.update({
                    where: { id: userId },
                    data: { walletBalance: { decrement: BigInt(amount) } },
                });

                // Create payout record
                await tx.payout.create({
                    data: {
                        userId,
                        amount: BigInt(amount),
                        fee: 0,
                        netAmount: amount,
                        type: 'instant',
                        status: 'completed',
                        initiatedAt: new Date(),
                        completedAt: new Date(),
                    },
                });
            }, {
                maxWait: 5000, // 5 seconds max wait to connect
                timeout: 10000 // 10 seconds max transaction time
            });

            clearSession(phone);
            await reply(phone, t(lang, 'cashoutSuccess', amount.toLocaleString('en-IN')));
        } catch (err) {
            logger.error('WhatsApp cashout failed:', err);
            clearSession(phone);
            await reply(phone, t(lang, 'cashoutFailed'));
        }
    } else {
        clearSession(phone);
        await reply(phone, t(lang, 'cashoutCancelled'));
    }
}

// ── Other handlers ──────────────────────────────────────────

async function handleGigScore(phone, user, text, session) {
    const lang = session.lang || 'en';
    try {
        const gs = await prisma.gigScoreHistory.findFirst({
            where: { userId: user.id },
            orderBy: { month: 'desc' },
        });
        if (gs) {
            await reply(phone, t(lang, 'gigscore', gs.totalScore, 'Active'));
        } else {
            await reply(phone, t(lang, 'gigscoreEmpty'));
        }
    } catch (err) {
        logger.error('WhatsApp gigscore query failed:', err);
        await reply(phone, `⚠️ Error fetching GigScore. Try again.`);
    }
}

async function handleTransactions(phone, user, text, session) {
    const lang = session.lang || 'en';
    try {
        const txns = await prisma.transactions.findMany({
            where: { user_id: user.id },
            orderBy: { sms_timestamp: 'desc' },
            take: 5,
        });

        if (txns.length === 0) {
            await reply(phone, t(lang, 'transactionsEmpty'));
            return;
        }

        let list = '';
        for (const tx of txns) {
            const dir = tx.direction === 'credit' ? '🟢 +' : '🔴 -';
            const date = new Date(tx.sms_timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            list += `${dir}₹${tx.amount?.toFixed(0)} • ${tx.category || 'N/A'} • ${date}\n`;
        }

        await reply(phone, t(lang, 'transactionsHeader') + '\n' + list + '\nOpen the app for full details 📱');
    } catch (err) {
        logger.error('WhatsApp transactions query failed:', err);
        await reply(phone, `⚠️ Error fetching transactions. Try again.`);
    }
}

async function handleWeeklyReport(phone, user, text, session) {
    const lang = session?.lang || 'en';
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        const earnings = await prisma.earning.findMany({
            where: { userId: user.id, date: { gte: weekAgo } },
        });

        if (earnings.length === 0) {
            await reply(phone, t(lang, 'weeklyHeader') + '\n' + t(lang, 'weeklyNoData'));
            return;
        }

        const totalAmount = earnings.reduce((sum, e) => sum + Number(e.netAmount || 0), 0);
        const totalCount = earnings.length;
        const avgPerDay = Math.round(totalAmount / 7);

        // Group by day
        const byDay = {};
        for (const e of earnings) {
            const day = new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            byDay[day] = (byDay[day] || 0) + Number(e.netAmount || 0);
        }

        // Group by platform
        const byPlatform = {};
        for (const e of earnings) {
            const p = e.platform || 'other';
            byPlatform[p] = (byPlatform[p] || 0) + Number(e.netAmount || 0);
        }

        let dayBreakdown = '';
        for (const [day, amount] of Object.entries(byDay)) {
            const bar = '█'.repeat(Math.min(Math.round(amount / avgPerDay * 3), 10));
            dayBreakdown += `  ${day}: ₹${amount.toLocaleString('en-IN')} ${bar}\n`;
        }

        let platformBreakdown = '';
        for (const [platform, amount] of Object.entries(byPlatform)) {
            const pct = Math.round(amount / totalAmount * 100);
            platformBreakdown += `  • ${capitalize(platform)}: ₹${amount.toLocaleString('en-IN')} (${pct}%)\n`;
        }

        const bal = Number(user.walletBalance || 0);

        await reply(phone,
            t(lang, 'weeklyHeader') +
            `\n💰 *Total: ₹${totalAmount.toLocaleString('en-IN')}*\n` +
            `📦 Orders/Trips: ${totalCount}\n` +
            `📈 Daily Avg: ₹${avgPerDay.toLocaleString('en-IN')}\n` +
            `💼 Current Balance: ₹${bal.toLocaleString('en-IN')}\n` +
            `\n📅 *Daily Breakdown:*\n${dayBreakdown}` +
            `\n📱 *By Platform:*\n${platformBreakdown}` +
            `\nKeep it up! 💪`
        );
    } catch (err) {
        logger.error('WhatsApp weekly report failed:', err);
        await reply(phone, `⚠️ Error generating weekly report. Try again.`);
    }
}

async function handleHelp(phone, user, text, session) {
    const lang = session?.lang || 'en';
    await WhatsAppService.sendInteractiveList(
        formatPhone(phone),
        t(lang, 'help'),
        '📋 Commands',
        [
            {
                title: '💰 Financial',
                rows: [
                    { id: 'cmd_balance', title: '💰 Balance' },
                    { id: 'cmd_earnings', title: '📊 Earnings' },
                    { id: 'cmd_cashout', title: '💸 Cashout' },
                    { id: 'cmd_report', title: '📊 Weekly Report' },
                ],
            },
            {
                title: '📋 Other',
                rows: [
                    { id: 'cmd_transactions', title: '📋 Transactions' },
                    { id: 'cmd_gigscore', title: '⭐ GigScore' },
                ],
            },
        ]
    );
}

async function handleUnknown(phone, user, text, session) {
    const lang = session?.lang || 'en';
    await reply(phone, t(lang, 'unknown', text));
}

// ── Helpers ──────────────────────────────────────────────────

function normalizePhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
    if (cleaned.length === 10) return '+91' + cleaned;
    return '+' + cleaned;
}

function formatPhone(phone) {
    return phone.startsWith('+') ? phone : '+' + phone;
}

async function findUserByPhone(phone) {
    let user = await prisma.user.findFirst({ where: { phone } });
    if (!user) user = await prisma.user.findFirst({ where: { phone: phone.replace('+', '') } });
    if (!user) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length >= 10) {
            const last10 = cleaned.slice(-10);
            user = await prisma.user.findFirst({ where: { phone: { endsWith: last10 } } });
        }
    }
    return user;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function reply(phone, message) {
    try {
        await WhatsAppService.sendMessage(formatPhone(phone), message);
        logger.debug('Bot reply sent', { phone: phone.slice(-4), length: message.length });
    } catch (err) {
        logger.error('Bot reply failed:', err.message);
    }
}

module.exports = WhatsAppBot;
