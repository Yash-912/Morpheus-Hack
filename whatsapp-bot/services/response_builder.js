// ============================================================
// Response Builder — build WhatsApp-formatted response objects
// ============================================================

const axios = require('axios');
const logger = require('../utils/logger');

const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_NUMBER_ID;

let twilioClient = null;
try {
    const twilio = require('twilio');
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
} catch (_) { }

const ResponseBuilder = {
    /**
     * Send a plain text WhatsApp message to a phone number.
     * Tries Meta API first, falls back to Twilio.
     * @param {string} phone — E.164 e.g. +919876543210
     * @param {string} text — message body (supports WhatsApp *bold* _italic_ ~strike~)
     */
    async send(phone, text) {
        // Primary: Meta WhatsApp Business API
        if (META_TOKEN && META_PHONE_ID) {
            try {
                await axios.post(
                    `https://graph.facebook.com/v18.0/${META_PHONE_ID}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: phone.replace('+', ''),
                        type: 'text',
                        text: { body: text, preview_url: false },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${META_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 10000,
                    }
                );
                logger.debug('Message sent via Meta', { to: phone.slice(-4), chars: text.length });
                return true;
            } catch (err) {
                logger.warn('Meta send failed, trying Twilio:', err.response?.data?.error?.message || err.message);
            }
        }

        // Fallback: Twilio
        return ResponseBuilder._sendViaTwilio(phone, text);
    },

    /**
     * Send a WhatsApp template message (required for first 24h contact).
     */
    async sendTemplate(phone, templateName, components = []) {
        if (!META_TOKEN || !META_PHONE_ID) {
            logger.warn('Meta API not configured, skipping template');
            return false;
        }
        try {
            await axios.post(
                `https://graph.facebook.com/v18.0/${META_PHONE_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: phone.replace('+', ''),
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: 'en_US' },
                        components,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${META_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );
            return true;
        } catch (err) {
            logger.error('Template send failed:', err.message);
            return false;
        }
    },

    async _sendViaTwilio(phone, text) {
        if (!twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
            logger.warn('Twilio not configured, message dropped');
            return false;
        }
        try {
            await twilioClient.messages.create({
                body: text,
                from: process.env.TWILIO_WHATSAPP_NUMBER,
                to: `whatsapp:${phone}`,
            });
            logger.debug('Message sent via Twilio', { to: phone.slice(-4) });
            return true;
        } catch (err) {
            logger.error('Twilio send failed:', err);
            return false;
        }
    },

    /**
     * Parse incoming webhook body (Meta format).
     * @returns {{ phone, message, messageId, timestamp } | null}
     */
    parseIncomingMeta(body) {
        try {
            const entry = body?.entry?.[0];
            const change = entry?.changes?.[0];
            const value = change?.value;

            if (!value?.messages?.length) return null;

            const msg = value.messages[0];
            const contact = value.contacts?.[0];

            return {
                phone: '+' + msg.from,
                message: msg.text?.body || '',
                messageId: msg.id,
                timestamp: parseInt(msg.timestamp, 10) * 1000,
                senderName: contact?.profile?.name || '',
                messageType: msg.type, // 'text', 'image', 'audio', etc.
            };
        } catch (err) {
            logger.error('parseIncomingMeta error:', err.message);
            return null;
        }
    },

    /**
     * Parse incoming webhook body (Twilio format).
     * @param {object} body — req.body from Twilio webhook
     * @returns {{ phone, message, messageId } | null}
     */
    parseIncomingTwilio(body) {
        try {
            if (!body?.Body || !body?.From) return null;
            const phone = body.From.replace('whatsapp:', '').replace(' ', '+');
            return {
                phone,
                message: body.Body,
                messageId: body.MessageSid,
                timestamp: Date.now(),
                senderName: body.ProfileName || '',
                messageType: body.NumMedia > 0 ? 'image' : 'text',
            };
        } catch (err) {
            logger.error('parseIncomingTwilio error:', err.message);
            return null;
        }
    },
};

module.exports = ResponseBuilder;
