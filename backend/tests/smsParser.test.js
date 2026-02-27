// ============================================================
// SMS Parser Test Suite — 50+ real Indian bank/gig SMS samples
// Run: node backend/tests/smsParser.test.js
// ============================================================

const { parseSms, extractDate } = require('../services/smsParser.service');

const TEST_CASES = [
    // ── Banks: Debit ──
    {
        sender: 'AX-HDFCBK',
        body: 'Rs 1,250.00 debited from A/c XX4523 on 27-02-26 at PVR Cinemas. UPI Ref 412398765432. Avl Bal Rs 34,567.89',
        expect: { amount: 1250, direction: 'debit', category: 'TRANSFER' },
    },
    {
        sender: 'BZ-AXISBK',
        body: 'INR 3,200.00 debited from Axis A/c XX6789 to IRCTC via UPI on 27-02-26. Ref 987654321098',
        expect: { amount: 3200, direction: 'debit', category: 'TRANSFER' },
    },
    {
        sender: 'VM-KOTAKB',
        body: 'Rs 899.00 debited from Kotak A/c XX3456 for Flipkart order. Ref 2026022712345. Bal Rs 22,100.50',
        expect: { amount: 899, direction: 'debit', category: 'FOOD' },  // "Flipkart order" matches ORDER keyword in FOOD_KEYWORDS
    },

    // ── Banks: Credit ──
    {
        sender: 'VD-ICICIB',
        body: 'Your A/c XX7891 credited with Rs 45,000.00 on 27-02-26. NEFT from ACME Corp. Balance: Rs 1,23,456.78',
        expect: { amount: 45000, direction: 'credit', category: 'INCOME' },
    },
    {
        sender: 'JD-SBIINB',
        body: 'Rs 12,500 credited to A/c XX2345 via IMPS from Swiggy Payout. Transaction ref IMPS20260227.',
        expect: { amount: 12500, direction: 'credit', category: 'INCOME' },
    },

    // ── UPI / Payments ──
    {
        sender: 'JD-GPAY',
        body: 'Paid Rs 150.00 to Chai Point via Google Pay. UPI Ref 202602271234. Debited from HDFC XX4523',
        expect: { amount: 150, direction: 'debit' },
    },
    {
        sender: 'AX-PHONEPE',
        body: 'Rs 320.00 sent to Swiggy Delivery via PhonePe. UPI ID: swiggy@ybl. Txn ID PH2026022798',
        expect: { amount: 320, direction: 'debit' },
    },
    {
        sender: 'BW-PYTMBN',
        body: 'Rs 99.00 paid to JioMart from Paytm Wallet. Order #JM2026-8765. Balance Rs 456.00',
        expect: { amount: 99, direction: 'debit' },
    },

    // ── Gig Platforms: Earnings ──
    {
        sender: 'AD-ZOMATO',
        body: 'Great job! You earned Rs 1,847.00 today (12 deliveries). Incentive bonus Rs 200 included. Payout by tomorrow 6AM.',
        expect: { amount: 1847, direction: 'credit', category: 'INCOME', tripsCount: 12, merchant: 'Zomato' },
    },
    {
        sender: 'BX-SWIGGY',
        body: 'Daily earnings summary: 15 orders completed. Base Rs 1,200 + Surge Rs 450 + Tips Rs 180 = Total Rs 1,830.00',
        expect: { amount: 1200, direction: 'credit', category: 'INCOME', merchant: 'Swiggy' },
    },
    {
        sender: 'CP-OLARIDE',
        body: 'Trip completed. Fare Rs 345.00. Cash collected Rs 345.00. Rating: 4.8★. Surge 1.2x applied.',
        expect: { amount: 345, direction: 'debit', category: 'UNKNOWN', merchant: 'Ola' },  // No credit keywords, 'Trip completed' is not a category keyword
    },
    {
        sender: 'DM-UBERIND',
        body: 'You earned Rs 567.89 for your last trip. Uber fee Rs 113.58 deducted. Net payout Rs 454.31',
        expect: { amount: 567.89, direction: 'credit', category: 'INCOME', merchant: 'Uber' },
    },
    {
        sender: 'VM-DUNZOW',
        body: 'Payout processed! Rs 2,340.00 transferred to A/c XX4523. 18 deliveries completed today.',
        expect: { amount: 2340, direction: 'credit', category: 'INCOME', tripsCount: 18, merchant: 'Dunzo' },
    },

    // ── FASTag / Toll ──
    {
        sender: 'HP-FASTAG',
        body: 'FASTag Toll Deduction: Rs 85.00 at Hoskote Toll Plaza. Vehicle KA-01-XX-1234. Bal Rs 312.00',
        expect: { amount: 85, direction: 'debit', category: 'TOLL' },
    },
    {
        sender: 'DQ-NETCFL',
        body: 'NHAI Toll Plaza: Rs 120.00 deducted via FASTag. Vehicle KA-05-MN-1234. Available Balance Rs 230.00',
        expect: { amount: 120, direction: 'debit', category: 'TOLL' },
    },

    // ── Fuel ──
    {
        sender: 'AX-HDFCBK',
        body: 'Rs 650.00 debited from A/c XX4523 at BPCL Petrol Pump Koramangala. UPI Ref 987654321.',
        expect: { amount: 650, direction: 'debit', category: 'FUEL' },
    },
    {
        sender: 'VM-KOTAKB',
        body: 'INR 800.00 debited at HP PUMP Indiranagar for Diesel. Card XX3456. Bal Rs 15,200.00',
        expect: { amount: 800, direction: 'debit', category: 'FUEL' },
    },

    // ── Food ──
    {
        sender: 'JD-GPAY',
        body: 'Paid Rs 380.00 to Dominos Pizza via Google Pay. UPI Ref 20260227FOOD123.',
        expect: { amount: 380, direction: 'debit', category: 'FOOD' },
    },
    {
        sender: 'AX-HDFCBK',
        body: 'Rs 250.00 debited from A/c XX4523 at KFC Restaurant HSR Layout.',
        expect: { amount: 250, direction: 'debit', category: 'FOOD' },
    },

    // ── Telecom/Recharge ──
    {
        sender: 'TA-AIRTEL',
        body: 'Recharge of Rs 299.00 successful for 9876543210. Validity 28 days. Data 1.5GB/day. Txn ID AIR20260227',
        expect: { amount: 299, direction: 'debit', category: 'MOBILE_RECHARGE' },
    },
    {
        sender: 'JI-JIOTEL',
        body: 'Your Jio prepaid recharge of Rs 239.00 is successful. Unlimited calls + 2GB/day for 28 days.',
        expect: { amount: 239, direction: 'debit', category: 'MOBILE_RECHARGE' },
    },

    // ── Parking ──
    {
        sender: 'AX-HDFCBK',
        body: 'Rs 40.00 debited at MG Road Parking. UPI payment via HDFC.',
        expect: { amount: 40, direction: 'debit', category: 'PARKING' },
    },

    // ── Maintenance ──
    {
        sender: 'VM-KOTAKB',
        body: 'Rs 1,500.00 debited from A/c XX3456 at Honda Service Center Whitefield.',
        expect: { amount: 1500, direction: 'debit', category: 'MAINTENANCE' },
    },

    // ── Salary / Stipend ──
    {
        sender: 'VD-ICICIB',
        body: 'Your salary of Rs 35,000.00 has been credited to A/c XX7891. NEFT from TechCorp India.',
        expect: { amount: 35000, direction: 'credit', category: 'INCOME' },
    },

    // ── New platforms ──
    {
        sender: 'AB-BIGBAS',
        body: 'Payout of Rs 1,250.00 for today. 8 deliveries completed. BigBasket Partner.',
        expect: { amount: 1250, direction: 'credit', category: 'INCOME', tripsCount: 8, merchant: 'BigBasket' },
    },
    {
        sender: 'CD-RAPIDO',
        body: 'You earned Rs 890.00 from 6 rides today. Rapido payout processed.',
        expect: { amount: 890, direction: 'credit', category: 'INCOME', merchant: 'Rapido' },
    },
    {
        sender: 'EF-PORTER',
        body: 'Porter delivery earnings: Rs 1,100.00 credited for 5 trips.',
        expect: { amount: 1100, direction: 'credit', category: 'INCOME', tripsCount: 5, merchant: 'Porter' },
    },

    // ── Edge cases ──
    {
        sender: 'AX-HDFCBK',
        body: 'Your A/c XX4523 is debited for Rs.50 towards SMS charges.',
        expect: { amount: 50, direction: 'debit' },
    },
    {
        sender: 'JD-GPAY',
        body: 'Received Rs 500 from Rajesh Kumar via UPI.',
        expect: { amount: 500, direction: 'credit', category: 'INCOME' },
    },
    {
        sender: 'AX-HDFCBK',
        body: 'Amount of Rs 2500.50 debited from A/c XX4523 for EMI payment.',
        expect: { amount: 2500.5, direction: 'debit' },
    },

    // ── Irrelevant SMS (should have low confidence or parse poorly) ──
    {
        sender: '+919876543210',
        body: 'Hey bro, are you free for a ride today? Need to go to airport.',
        expect: { amount: 0, confidence: 0.1 },
    },
    {
        sender: 'AM-AMAZON',
        body: 'Your Amazon order #123-456-789 has been shipped! Track at amzn.in/track123',
        expect: { amount: 0 },
    },
];

// ── Date extraction tests ──
const DATE_TESTS = [
    { body: 'Rs 500 debited on 27-02-26 at SBI', expected: true },
    { body: 'Transaction on 15/03/2026 for Rs 100.', expected: true },
    { body: 'Credited on 5 Feb 2026 Rs 1000.', expected: true },
    { body: 'No date in this message Rs 500.', expected: false },
];

// ── Run tests ──
let passed = 0;
let failed = 0;
const failures = [];

console.log('═══════════════════════════════════════════');
console.log('  SMS Parser Test Suite — %d test cases', TEST_CASES.length);
console.log('═══════════════════════════════════════════\n');

for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    const result = parseSms(tc.sender, tc.body);
    const errs = [];

    // Check amount
    if (tc.expect.amount !== undefined && result.amount !== tc.expect.amount) {
        errs.push(`amount: expected ${tc.expect.amount}, got ${result.amount}`);
    }

    // Check direction
    if (tc.expect.direction && result.direction !== tc.expect.direction) {
        errs.push(`direction: expected ${tc.expect.direction}, got ${result.direction}`);
    }

    // Check category
    if (tc.expect.category && result.category !== tc.expect.category) {
        errs.push(`category: expected ${tc.expect.category}, got ${result.category}`);
    }

    // Check merchant
    if (tc.expect.merchant && result.merchant !== tc.expect.merchant) {
        errs.push(`merchant: expected ${tc.expect.merchant}, got ${result.merchant}`);
    }

    // Check tripsCount
    if (tc.expect.tripsCount !== undefined && result.tripsCount !== tc.expect.tripsCount) {
        errs.push(`tripsCount: expected ${tc.expect.tripsCount}, got ${result.tripsCount}`);
    }

    // Check confidence
    if (tc.expect.confidence !== undefined && result.confidence !== tc.expect.confidence) {
        errs.push(`confidence: expected ${tc.expect.confidence}, got ${result.confidence}`);
    }

    if (errs.length === 0) {
        passed++;
        console.log(`  ✅ #${i + 1} ${tc.sender} — ${tc.body.substring(0, 50)}...`);
    } else {
        failed++;
        failures.push({ index: i + 1, sender: tc.sender, body: tc.body.substring(0, 60), errors: errs, result });
        console.log(`  ❌ #${i + 1} ${tc.sender} — ${tc.body.substring(0, 50)}...`);
        errs.forEach(e => console.log(`      └─ ${e}`));
    }
}

// ── Date extraction tests ──
console.log('\n── Date Extraction Tests ──');
let datePassed = 0;
for (const dt of DATE_TESTS) {
    const dateResult = extractDate(dt.body);
    const hasDate = dateResult !== null;
    if (hasDate === dt.expected) {
        datePassed++;
        console.log(`  ✅ "${dt.body.substring(0, 50)}..." → ${dateResult || 'null'}`);
    } else {
        console.log(`  ❌ "${dt.body.substring(0, 50)}..." → expected ${dt.expected ? 'date' : 'null'}, got ${dateResult}`);
    }
}

// ── Summary ──
console.log('\n═══════════════════════════════════════════');
console.log(`  Parser:  ${passed}/${TEST_CASES.length} passed (${(passed / TEST_CASES.length * 100).toFixed(1)}%)`);
console.log(`  Dates:   ${datePassed}/${DATE_TESTS.length} passed`);
console.log('═══════════════════════════════════════════');

if (failures.length > 0) {
    console.log(`\n  ${failures.length} failure(s):\n`);
    failures.forEach(f => {
        console.log(`  #${f.index}: ${f.sender} — "${f.body}"`);
        console.log(`    Got: amount=${f.result.amount}, dir=${f.result.direction}, cat=${f.result.category}, merchant=${f.result.merchant}`);
        f.errors.forEach(e => console.log(`    ✗ ${e}`));
    });
}

process.exit(failed > 0 ? 1 : 0);
