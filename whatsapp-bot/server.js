// ============================================================
// GigPay WhatsApp Bot — Express Server
// Handles Meta Business API & Twilio webhooks
// Port: BOT_PORT (default 5001)
// ============================================================

'use strict';
require('dotenv').config();

const express = require('express');
const { handleMessage } = require('./handlers/message.handler');
const ResponseBuilder = require('./services/response_builder');
const logger = require('./utils/logger');

const app = express();

// ---- Body parsing ----
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio sends URL-encoded

// ---- Health check ----
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gigpay-whatsapp-bot', timestamp: new Date().toISOString() });
});

// ============================================================
// META WHATSAPP BUSINESS API WEBHOOK
// ============================================================

/**
 * GET /webhook
 * Meta verification handshake — called once when you register the webhook URL.
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
        logger.info('Meta webhook verified');
        return res.status(200).send(challenge);
    }

    logger.warn('Meta webhook verification failed', { mode, token });
    res.sendStatus(403);
});

/**
 * POST /webhook
 * Receives incoming WhatsApp messages from Meta.
 */
app.post('/webhook', async (req, res) => {
    // Acknowledge immediately (Meta requires <5s response)
    res.sendStatus(200);

    const incoming = ResponseBuilder.parseIncomingMeta(req.body);
    if (!incoming) return; // Status updates, delivery receipts, etc.

    logger.info('Meta message received', {
        from: incoming.phone.slice(-4),
        type: incoming.messageType,
        len: incoming.message.length,
    });

    // Only handle text messages
    if (incoming.messageType !== 'text' || !incoming.message.trim()) {
        await ResponseBuilder.send(
            incoming.phone,
            '📝 Please send a text message. Type *HELP* to see available commands.'
        );
        return;
    }

    // Route to message handler
    try {
        const reply = await handleMessage({
            phone: incoming.phone,
            message: incoming.message,
            senderName: incoming.senderName,
        });

        if (reply) {
            await ResponseBuilder.send(incoming.phone, reply);
        }
    } catch (err) {
        logger.error('Message handling failed:', err);
        await ResponseBuilder.send(incoming.phone, '😕 Something went wrong. Please try again later.');
    }
});

// ============================================================
// TWILIO WHATSAPP WEBHOOK
// Twilio sends POST with URL-encoded body to /webhook/twilio
// ============================================================

app.post('/webhook/twilio', async (req, res) => {
    const incoming = ResponseBuilder.parseIncomingTwilio(req.body);

    if (!incoming || !incoming.message.trim()) {
        return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    logger.info('Twilio message received', {
        from: incoming.phone.slice(-4),
        type: incoming.messageType,
    });

    // Respond immediately with empty TwiML, send reply async
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

    if (incoming.messageType !== 'text') return;

    try {
        const reply = await handleMessage({
            phone: incoming.phone,
            message: incoming.message,
            senderName: incoming.senderName,
        });

        if (reply) {
            await ResponseBuilder._sendViaTwilio(incoming.phone, reply);
        }
    } catch (err) {
        logger.error('Twilio message handling failed:', err);
    }
});

// ============================================================
// CALLBACK — biometric completion from PWA
// The PWA deep-link auth page calls this after successful biometric
// ============================================================

app.post('/callback/biometric-complete', async (req, res) => {
    const { phone, withdrawalToken, success, error } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone required' });
    }

    res.json({ success: true, message: 'Callback received' });

    const SessionService = require('./services/session.service');
    const GigPayAPI = require('./services/gigpay_api.service');
    const { getResponseLanguage } = require('./utils/language_detect');
    const { getTemplate } = require('./utils/templates');
    const CashoutHandler = require('./handlers/cashout.handler');

    const session = await SessionService.get(phone);
    if (!session || session.intent !== 'CASHOUT') return;

    // Try to get user
    let user = null;
    try {
        user = await GigPayAPI.getUserByPhone(phone);
    } catch {
        await ResponseBuilder.send(phone, '😕 Session expired. Please try cashing out again.');
        return;
    }

    const lang = session.lang || 'en';

    if (!success || error) {
        await SessionService.clear(phone);
        const msg = getTemplate(lang, 'cashoutFailed', error || 'Biometric verification failed');
        await ResponseBuilder.send(phone, msg);
        return;
    }

    const reply = await CashoutHandler.completeAfterBiometric({
        user,
        session,
        withdrawalToken,
        lang,
        phone,
    });

    await ResponseBuilder.send(phone, reply);
});

// ============================================================
// 404 & Error handlers
// ============================================================

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// Start server
// ============================================================

const PORT = parseInt(process.env.BOT_PORT || process.env.PORT || '5001', 10);

app.listen(PORT, () => {
    logger.info(`GigPay WhatsApp Bot running on port ${PORT}`);
    logger.info(`Meta webhook URL: POST /webhook`);
    logger.info(`Twilio webhook URL: POST /webhook/twilio`);
    logger.info(`Health check: GET /health`);
});

module.exports = app;
