// ============================================================
// Message Templates — English + Hindi strings
// ============================================================

const templates = {
    en: {
        welcome: (name) =>
            `👋 Welcome back${name ? ', ' + name : ''}!\n\nI'm your GigPay assistant. Here's what I can help with:\n\n💰 *BALANCE* — Check your wallet\n📊 *EARNINGS* — Today's earnings\n🔮 *FORECAST* — Tomorrow's prediction\n🏙️ *ZONES* — Hot delivery zones\n💸 *CASHOUT {amount}* — Withdraw money\n🏦 *LOAN* — Emergency loan\n🛡️ *INSURANCE* — Micro insurance\n🧾 *TAX* — Tax summary\n💼 *EXPENSES* — Monthly expenses\n🤝 *JOBS* — Community jobs\n\nType any command or just ask me!`,

        balance: (data) =>
            `💰 *Your GigPay Wallet*\n\n` +
            `Available: *₹${paiseToRupees(data.walletBalance)}*\n` +
            `Today's earnings: ₹${paiseToRupees(data.pendingEarnings)}\n` +
            `Today withdrawn: ₹${paiseToRupees(data.todayWithdrawn)}\n` +
            `Daily remaining: ₹${paiseToRupees(data.dailyRemaining)}\n\n` +
            `Ready to cash out? Reply: *CASHOUT {amount}*`,

        earningsToday: (data) => {
            const platforms = Object.entries(data.byPlatform || {})
                .map(([p, amt]) => `  • ${capitalize(p)}: ₹${paiseToRupees(amt)}`)
                .join('\n');
            return (
                `📊 *Today's Earnings*\n\n` +
                `Total: *₹${paiseToRupees(data.totalAmount)}*\n` +
                `Trips: ${data.tripCount}\n\n` +
                (platforms ? `*By Platform:*\n${platforms}\n\n` : '') +
                `Want to check tomorrow's forecast? Reply: *FORECAST*`
            );
        },

        forecast: (data) => {
            const factors = (data.factors || []).map((f) => `  • ${f}`).join('\n');
            return (
                `🔮 *Tomorrow's Earnings Forecast*\n\n` +
                `Expected: *₹${paiseToRupees(data.expected || data.expectedMean)}*\n` +
                `Range: ₹${paiseToRupees(data.min || data.expectedMin)} – ₹${paiseToRupees(data.max || data.expectedMax)}\n` +
                `Confidence: ${Math.round((data.confidence || 0.7) * 100)}%\n\n` +
                (factors ? `*Key Factors:*\n${factors}\n\n` : '') +
                `Check hot zones for best pickups: *ZONES*`
            );
        },

        zones: (zones) => {
            if (!zones || zones.length === 0) {
                return `🏙️ No active hot zones right now. Check back in 5 minutes.`;
            }
            const list = zones
                .slice(0, 3)
                .map((z, i) => `${i + 1}. *${z.name || 'Zone ' + (i + 1)}* — Score: ${z.score}/100`)
                .join('\n');
            return `🏙️ *Top Hot Zones Right Now*\n\n${list}\n\n_Updated every 5 minutes_\n\nNavigate: open GigPay app → Zones tab`;
        },

        cashoutStep1: (amount, fee, netAmount, upiId) =>
            `💸 *Cashout Confirmation*\n\n` +
            `Amount: ₹${paiseToRupees(amount)}\n` +
            `Fee: ₹${paiseToRupees(fee)}\n` +
            `*You'll receive: ₹${paiseToRupees(netAmount)}*\n` +
            `UPI: ${upiId || 'your registered UPI'}\n` +
            `Time: ~30 seconds\n\n` +
            `Reply *YES* to confirm or *NO* to cancel.`,

        cashoutVerifyLink: (deepLink) =>
            `🔐 *Biometric Verification Required*\n\n` +
            `For your security, please verify with fingerprint/face:\n\n` +
            `👉 ${deepLink}\n\n` +
            `_Link expires in 5 minutes_`,

        cashoutSuccess: (netAmount) =>
            `✅ *Cashout Successful!*\n\n` +
            `₹${paiseToRupees(netAmount)} is on its way to your UPI!\n` +
            `Expected in 30 seconds – 2 minutes.\n\n` +
            `You'll get a notification when it arrives 🎉`,

        cashoutFailed: (reason) =>
            `❌ *Cashout Failed*\n\n${reason || 'Something went wrong. Please try again.'}\n\nNeed help? Type *HELP*`,

        loanEligible: (data) =>
            `🏦 *Emergency Loan*\n\n` +
            `Your GigScore: *${data.gigScore}/850*\n` +
            `Max eligible: *₹${paiseToRupees(data.maxAmount)}*\n` +
            `Interest: 2% per month\n` +
            `Auto-repayment from each cashout\n\n` +
            `To apply, reply: *LOAN {amount}*\nExample: LOAN 2000`,

        loanNotEligible: (reason) =>
            `🏦 *Loan Eligibility*\n\n` +
            `Sorry, you're not eligible right now.\n` +
            `Reason: ${reason}\n\n` +
            `Keep using GigPay to improve your GigScore and unlock loans!`,

        loanActiveLoan: (data) =>
            `🏦 *Active Loan*\n\n` +
            `Borrowed: ₹${paiseToRupees(data.amount)}\n` +
            `Outstanding: *₹${paiseToRupees(data.outstanding)}*\n` +
            `Auto-deducting ${data.repaymentPercent}% per cashout\n\n` +
            `Keep earning to clear it faster! 💪`,

        loanApplied: (data) =>
            `✅ *Loan Approved!*\n\n` +
            `₹${paiseToRupees(data.amount)} has been added to your wallet!\n` +
            `Repayment: ${data.repaymentPercent}% auto-deducted from each cashout.\n\n` +
            `Use it wisely 🙏`,

        insurance: (plans) => {
            const list = (plans || [])
                .slice(0, 4)
                .map((p, i) => `${i + 1}. *${p.name}* — ₹${paiseToRupees(p.premium)}/day | Cover: ₹${paiseToRupees(p.coverAmount)}`)
                .join('\n');
            return (
                `🛡️ *Micro Insurance Plans*\n\n${list}\n\n` +
                `To activate, reply: *INSURE {number}*\nExample: INSURE 1`
            );
        },

        insuranceActivated: (policy) =>
            `✅ *Insurance Activated!*\n\n` +
            `Plan: ${policy.type}\n` +
            `Valid until: ${formatDate(policy.validTo)}\n` +
            `Cover: ₹${paiseToRupees(policy.coverAmount)}\n\n` +
            `You're protected! Ride safe 🚗`,

        tax: (data) =>
            `🧾 *Tax Summary FY ${data.financialYear}*\n\n` +
            `Gross Income: ₹${paiseToRupees(data.grossIncome)}\n` +
            `Total Deductions: ₹${paiseToRupees(data.totalDeductions)}\n` +
            `Taxable Income: *₹${paiseToRupees(data.taxableIncome)}*\n` +
            `Tax Payable: *₹${paiseToRupees(data.taxPayable)}*\n` +
            `Regime: ${data.taxRegime === 'new' ? 'New Regime' : 'Old Regime'}\n\n` +
            `Open GigPay app → Insights → Tax for full details & filing`,

        expenses: (data) => {
            const cats = Object.entries(data.byCategory || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, amt]) => `  • ${capitalize(cat)}: ₹${paiseToRupees(amt)}`)
                .join('\n');
            return (
                `💼 *Monthly Expenses*\n\n` +
                `Total: *₹${paiseToRupees(data.total)}*\n` +
                `Tax deductible: ₹${paiseToRupees(data.taxDeductible)}\n\n` +
                `*Top Categories:*\n${cats || '  No expenses yet'}\n\n` +
                `View details in GigPay app → Insights → Expenses`
            );
        },

        jobs: (jobs) => {
            if (!jobs || jobs.length === 0) {
                return `🤝 No nearby community jobs right now.\n\nPost a job: open GigPay app → Community → Post Job`;
            }
            const list = jobs
                .slice(0, 3)
                .map(
                    (j, i) =>
                        `${i + 1}. *${j.title}* — ₹${paiseToRupees(j.offeredPrice)}\n   📍 ${j.pickupLocation?.address || 'Location in app'}`
                )
                .join('\n\n');
            return `🤝 *Nearby Community Jobs*\n\n${list}\n\nView & accept in GigPay app → Community`;
        },

        help: () =>
            `🆘 *GigPay Bot Help*\n\n` +
            `Commands:\n` +
            `• *BALANCE* — Wallet balance\n` +
            `• *EARNINGS* — Today's earnings\n` +
            `• *FORECAST* — Tomorrow's prediction\n` +
            `• *ZONES* — Hot delivery zones\n` +
            `• *CASHOUT 500* — Withdraw ₹500\n` +
            `• *LOAN* — Check loan eligibility\n` +
            `• *LOAN 2000* — Apply for ₹2000 loan\n` +
            `• *INSURANCE* — View insurance plans\n` +
            `• *TAX* — This year's tax summary\n` +
            `• *EXPENSES* — Monthly expenses\n` +
            `• *JOBS* — Community jobs near you\n\n` +
            `Need more help? 📞 support@gigpay.in`,

        error: () =>
            `😕 Something went wrong. Please try again later.\n\nFor help: support@gigpay.in`,

        unknown: () =>
            `🤔 I didn't understand that. Here's what I can do:\n\n` +
            `Type *HELP* to see all commands.`,

        notRegistered: () =>
            `👋 Welcome to GigPay!\n\n` +
            `You're not registered yet. Download the app to get started:\n` +
            `🔗 https://gigpay.in\n\n` +
            `Already registered? Make sure your WhatsApp number matches your account.`,
    },

    hi: {
        welcome: (name) =>
            `👋 Namaste${name ? ' ' + name : ''}!\n\nMain aapka GigPay assistant hoon. Main in cheezein kar sakta hoon:\n\n💰 *BALANCE* — Wallet balance\n📊 *EARNINGS* — Aaj ki kamai\n🔮 *FORECAST* — Kal ki prediction\n🏙️ *ZONES* — Garam delivery zones\n💸 *CASHOUT {amount}* — Paise nikalo\n🏦 *LOAN* — Emergency loan\n🛡️ *INSURANCE* — Micro insurance\n🧾 *TAX* — Tax summary\n💼 *EXPENSES* — Mahine ke kharche\n🤝 *JOBS* — Community jobs\n\nKoi bhi command type karo!`,

        balance: (data) =>
            `💰 *Aapka GigPay Wallet*\n\n` +
            `Available: *₹${paiseToRupees(data.walletBalance)}*\n` +
            `Aaj ki kamai: ₹${paiseToRupees(data.pendingEarnings)}\n` +
            `Aaj nikala: ₹${paiseToRupees(data.todayWithdrawn)}\n` +
            `Baki limit: ₹${paiseToRupees(data.dailyRemaining)}\n\n` +
            `Cash nikalna hai? Reply karo: *CASHOUT {amount}*`,

        earningsToday: (data) => {
            const platforms = Object.entries(data.byPlatform || {})
                .map(([p, amt]) => `  • ${capitalize(p)}: ₹${paiseToRupees(amt)}`)
                .join('\n');
            return (
                `📊 *Aaj Ki Kamai*\n\n` +
                `Total: *₹${paiseToRupees(data.totalAmount)}*\n` +
                `Trips: ${data.tripCount}\n\n` +
                (platforms ? `*Platform wise:*\n${platforms}\n\n` : '') +
                `Kal ka forecast dekhna hai? Reply: *FORECAST*`
            );
        },

        forecast: (data) =>
            `🔮 *Kal Ki Kamai Ka Anuman*\n\n` +
            `Expected: *₹${paiseToRupees(data.expected || data.expectedMean)}*\n` +
            `Range: ₹${paiseToRupees(data.min || data.expectedMin)} – ₹${paiseToRupees(data.max || data.expectedMax)}\n` +
            `Confidence: ${Math.round((data.confidence || 0.7) * 100)}%\n\n` +
            `Hot zones check karo: *ZONES*`,

        zones: (zones) => {
            if (!zones || zones.length === 0) return `🏙️ Abhi koi active hot zone nahi hai. 5 minute baad check karo.`;
            const list = zones
                .slice(0, 3)
                .map((z, i) => `${i + 1}. *${z.name || 'Zone ' + (i + 1)}* — Score: ${z.score}/100`)
                .join('\n');
            return `🏙️ *Top Hot Zones Abhi*\n\n${list}\n\n_Har 5 minute mein update_`;
        },

        cashoutStep1: (amount, fee, netAmount) =>
            `💸 *Cashout Confirm Karo*\n\n` +
            `Amount: ₹${paiseToRupees(amount)}\n` +
            `Fee: ₹${paiseToRupees(fee)}\n` +
            `*Milega: ₹${paiseToRupees(netAmount)}*\n\n` +
            `*YES* likho confirm karne ke liye ya *NO* cancel karne ke liye`,

        cashoutVerifyLink: (deepLink) =>
            `🔐 *Biometric Verification Chahiye*\n\n` +
            `Security ke liye fingerprint/face verify karo:\n\n` +
            `👉 ${deepLink}\n\n` +
            `_5 minute mein expire ho jayega_`,

        cashoutSuccess: (netAmount) =>
            `✅ *Cashout Ho Gaya!*\n\n` +
            `₹${paiseToRupees(netAmount)} aapke UPI par aa raha hai!\n` +
            `30 second – 2 minute mein aa jayega 🎉`,

        loanEligible: (data) =>
            `🏦 *Emergency Loan*\n\n` +
            `GigScore: *${data.gigScore}/850*\n` +
            `Max loan: *₹${paiseToRupees(data.maxAmount)}*\n` +
            `Interest: 2% per month\n\n` +
            `Apply karne ke liye: *LOAN {amount}*\nExample: LOAN 2000`,

        help: () =>
            `🆘 *GigPay Bot Help*\n\n` +
            `Commands:\n` +
            `• *BALANCE* — Wallet balance\n` +
            `• *EARNINGS* — Aaj ki kamai\n` +
            `• *FORECAST* — Kal ka anuman\n` +
            `• *ZONES* — Hot zones\n` +
            `• *CASHOUT 500* — ₹500 nikalo\n` +
            `• *LOAN* — Loan eligibility\n` +
            `• *INSURANCE* — Insurance plans\n` +
            `• *TAX* — Tax summary\n` +
            `• *EXPENSES* — Kharche\n` +
            `• *JOBS* — Community jobs\n\n` +
            `Help ke liye: support@gigpay.in`,

        error: () => `😕 Kuch galat ho gaya. Dobara try karo.\n\nHelp: support@gigpay.in`,

        unknown: () => `🤔 Samajh nahi aaya. *HELP* type karo commands dekhne ke liye.`,
    },
};

// ---- Helpers ----

function paiseToRupees(paise) {
    if (!paise && paise !== 0) return '0';
    const rupees = Math.abs(paise) / 100;
    return rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Get a template message.
 * Falls back to English if Hindi key not available.
 */
function getTemplate(lang, key, ...args) {
    const langTemplates = templates[lang] || templates.en;
    const fn = langTemplates[key] || templates.en[key];
    if (!fn) return templates.en.error();
    return typeof fn === 'function' ? fn(...args) : fn;
}

module.exports = { templates, getTemplate, paiseToRupees, capitalize, formatDate };
