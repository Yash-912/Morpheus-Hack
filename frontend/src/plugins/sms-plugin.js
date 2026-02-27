// ============================================================
// SmsReader — Capacitor plugin bridge (JS side)
// Phase 1: incremental sync + realistic mock data
// ============================================================

import { registerPlugin } from '@capacitor/core';

const SmsReader = registerPlugin('SmsReader');

/**
 * Read SMS messages from the device inbox.
 * @param {number} limit — max messages to read (default 100)
 * @param {string|null} after — ISO timestamp; only read SMS newer than this
 * @returns {Promise<{ messages: Array<{ sender: string, body: string, timestamp: string }>, count: number }>}
 */
export async function readSms(limit = 100, after = null) {
    // Native path — pass "after" for incremental sync
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        const opts = { limit };
        if (after) opts.after = after;
        return await SmsReader.readSms(opts);
    }

    // ---- Web fallback — realistic Indian financial mock SMS ----
    console.warn('[SmsReader] Not on native platform — returning mock SMS data');

    const now = Date.now();
    const h = 3600000; // 1 hour in ms

    const allMockMessages = [
        // ---- Banks ----
        { sender: 'AX-HDFCBK', body: 'Rs 1,250.00 debited from A/c XX4523 on 27-02-26 at PVR Cinemas. UPI Ref 412398765432. Avl Bal Rs 34,567.89', timestamp: ts(now - h * 1) },
        { sender: 'VD-ICICIB', body: 'Your A/c XX7891 credited with Rs 45,000.00 on 27-02-26. NEFT from ACME Corp. Balance: Rs 1,23,456.78', timestamp: ts(now - h * 2) },
        { sender: 'JD-SBIINB', body: 'Rs 500.00 withdrawn from ATM at SBI Branch Koramangala. A/c XX2345. Avl Bal Rs 8,901.23. 27-02-26', timestamp: ts(now - h * 4) },
        { sender: 'BZ-AXISBK', body: 'INR 3,200.00 debited from Axis A/c XX6789 to IRCTC via UPI on 27-02-26. Ref 987654321098', timestamp: ts(now - h * 6) },
        { sender: 'VM-KOTAKB', body: 'Rs 899.00 debited from Kotak A/c XX3456 for Flipkart order. Ref 2026022712345. Bal Rs 22,100.50', timestamp: ts(now - h * 8) },

        // ---- UPI / Payments ----
        { sender: 'JD-GPAY', body: 'Paid Rs 150.00 to Chai Point via Google Pay. UPI Ref 202602271234. Debited from HDFC XX4523', timestamp: ts(now - h * 0.5) },
        { sender: 'AX-PHONEPE', body: 'Rs 320.00 sent to Swiggy Delivery via PhonePe. UPI ID: swiggy@ybl. Txn ID PH2026022798', timestamp: ts(now - h * 3) },
        { sender: 'BW-PYTMBN', body: 'Rs 99.00 paid to JioMart from Paytm Wallet. Order #JM2026-8765. Balance Rs 456.00', timestamp: ts(now - h * 5) },

        // ---- Gig Platforms ----
        { sender: 'AD-ZOMATO', body: 'Great job! You earned Rs 1,847.00 today (12 deliveries). Incentive bonus Rs 200 included. Payout by tomorrow 6AM.', timestamp: ts(now - h * 1.5) },
        { sender: 'BX-SWIGGY', body: 'Daily earnings summary: 15 orders completed. Base Rs 1,200 + Surge Rs 450 + Tips Rs 180 = Total Rs 1,830.00', timestamp: ts(now - h * 2.5) },
        { sender: 'CP-OLARIDE', body: 'Trip completed. Fare Rs 345.00. Cash collected Rs 345.00. Rating: 4.8★. Surge 1.2x applied.', timestamp: ts(now - h * 7) },
        { sender: 'DM-UBERIND', body: 'You earned Rs 567.89 for your last trip. Uber fee Rs 113.58 deducted. Net payout Rs 454.31', timestamp: ts(now - h * 9) },
        { sender: 'VM-DUNZOW', body: 'Payout processed! Rs 2,340.00 transferred to A/c XX4523. 18 deliveries completed today.', timestamp: ts(now - h * 10) },

        // ---- FASTag ----
        { sender: 'HP-FASTAG', body: 'FASTag Toll Deduction: Rs 85.00 at Hoskote Toll Plaza. Vehicle KA-01-XX-1234. Bal Rs 312.00', timestamp: ts(now - h * 3.5) },

        // ---- Telecom ----
        { sender: 'TA-AIRTEL', body: 'Recharge of Rs 299.00 successful for 9876543210. Validity 28 days. Data 1.5GB/day. Txn ID AIR20260227', timestamp: ts(now - h * 12) },
        { sender: 'JI-JIOTEL', body: 'Your Jio prepaid recharge of Rs 239.00 is successful. Unlimited calls + 2GB/day for 28 days.', timestamp: ts(now - h * 24) },

        // ---- IRRELEVANT (should be discarded by backend) ----
        { sender: '+919876543210', body: 'Hey bro, are you free for a ride today? Need to go to airport.', timestamp: ts(now - h * 0.2) },
        { sender: 'AM-AMAZON', body: 'Your Amazon order #123-456-789 has been shipped! Track at amzn.in/track123', timestamp: ts(now - h * 11) },
        { sender: 'DM-DOMINOS', body: 'Hungry? Order now and get 50% off on all pizzas! Use code DOM50. Order at dominos.co.in', timestamp: ts(now - h * 13) },
        { sender: '+911234567890', body: 'Dear customer, your appointment is confirmed for tomorrow at 10 AM. Dr. Sharma Clinic.', timestamp: ts(now - h * 14) },
        { sender: 'TX-IRCTC', body: 'PNR 4567890123 CNF. Train 12345 Dep 27FEB 06:00 Arr 27FEB 14:00. Coach S3 Seat 45', timestamp: ts(now - h * 15) },
    ];

    // If "after" is provided, filter mock messages to only return newer ones
    let filtered = allMockMessages;
    if (after) {
        const afterTime = new Date(after).getTime();
        filtered = allMockMessages.filter((m) => new Date(m.timestamp).getTime() > afterTime);
    }

    return {
        messages: filtered.slice(0, limit),
        count: filtered.length,
    };
}

/** Helper: epoch ms → ISO string */
function ts(epochMs) {
    return new Date(epochMs).toISOString();
}

export default SmsReader;
