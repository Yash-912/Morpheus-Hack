// ============================================================
// Bot Test Client — simulate WhatsApp messages without Meta/Twilio
// Run: node test-bot.js
// ============================================================

'use strict';
require('dotenv').config();

const axios = require('axios');

const BOT_URL = `http://localhost:${process.env.BOT_PORT || 5001}`;
const PHONE = process.env.TEST_PHONE || '+919876543210'; // change to your test user's phone

// Helper: simulate a Meta-style webhook POST to the bot
async function sendMessage(messageText) {
    const metaPayload = {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'entry_1',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { display_phone_number: '919000000000', phone_number_id: 'test_id' },
                    contacts: [{ profile: { name: 'Test User' }, wa_id: PHONE.replace('+', '') }],
                    messages: [{
                        from: PHONE.replace('+', ''),
                        id: `msg_${Date.now()}`,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        text: { body: messageText },
                        type: 'text',
                    }]
                },
                field: 'messages',
            }]
        }]
    };

    try {
        await axios.post(`${BOT_URL}/webhook`, metaPayload, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log(`✅ Sent:    "${messageText}"`);
        console.log(`   (check your WhatsApp or bot logs for the reply)`);
    } catch (err) {
        console.error(`❌ Error sending message:`, err.response?.data || err.message);
    }
}

// Helper: check bot health
async function checkHealth() {
    try {
        const res = await axios.get(`${BOT_URL}/health`);
        console.log('✅ Bot health:', res.data);
    } catch (err) {
        console.error('❌ Bot not reachable. Is it running?', err.message);
        process.exit(1);
    }
}

// Helper: directly call getUserByPhone (backend internal endpoint)
async function testBackendAuth() {
    const BACKEND = process.env.GIGPAY_API_URL || 'http://localhost:5002';
    const SECRET = process.env.GIGPAY_BOT_SECRET || '';
    try {
        const res = await axios.get(`${BACKEND}/api/users/by-phone`, {
            params: { phone: PHONE },
            headers: { 'x-bot-secret': SECRET },
        });
        console.log('✅ Backend /by-phone response:', JSON.stringify(res.data.data, null, 2));
        return res.data.data;
    } catch (err) {
        console.error('❌ Backend auth failed:', err.response?.data || err.message);
        return null;
    }
}

// ---- Run test scenarios ----
async function runTests() {
    console.log('\n========================================');
    console.log('  GigPay WhatsApp Bot — Test Runner');
    console.log('========================================\n');

    // 1. Health check
    console.log('--- [1/7] Health Check ---');
    await checkHealth();

    // 2. Backend internal auth
    console.log('\n--- [2/7] Backend /by-phone Auth ---');
    await testBackendAuth();

    // Small delay between messages so the bot processes them sequentially
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));

    // 3. Help / Welcome
    console.log('\n--- [3/7] HELP intent ---');
    await sendMessage('help');
    await delay(1500);

    // 4. Balance
    console.log('\n--- [4/7] BALANCE intent ---');
    await sendMessage('balance');
    await delay(1500);

    // 5. Today earnings
    console.log('\n--- [5/7] EARNINGS intent ---');
    await sendMessage('aaj ki kamai kitni hai');
    await delay(1500);

    // 6. Forecast
    console.log('\n--- [6/7] FORECAST intent ---');
    await sendMessage('kal ka forecast bata');
    await delay(1500);

    // 7. Cashout flow (step 1)
    console.log('\n--- [7/7] CASHOUT intent (step 1) ---');
    await sendMessage('cashout 500');

    console.log('\n========================================');
    console.log('  Tests sent! Watch bot logs for replies.');
    console.log('  If real WhatsApp is configured, check');
    console.log(`  the phone number: ${PHONE}`);
    console.log('========================================\n');
}

runTests().catch(console.error);
