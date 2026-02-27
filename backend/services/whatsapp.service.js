// ============================================================
// WhatsApp Service — Meta Business API + Twilio fallback
// ============================================================

const axios = require('axios');
const twilio = require('twilio');
const logger = require('../utils/logger.utils');

const META_TOKEN = process.env.META_WHATSAPP_TOKEN;
const META_PHONE_ID = process.env.META_PHONE_NUMBER_ID;
const META_API_URL = `https://graph.facebook.com/v18.0/${META_PHONE_ID}/messages`;

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WA_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient = null;
if (TWILIO_SID && TWILIO_TOKEN) {
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
}

const WhatsAppService = {
  /**
   * Send a free-form text message via Meta WhatsApp Business API.
   * Falls back to Twilio on failure.
   * @param {string} phone — E.164 format (+91XXXXXXXXXX)
   * @param {string} message — text body
   * @returns {Promise<boolean>}
   */
  async sendMessage(phone, message) {
    // Try Meta API first
    if (META_TOKEN && META_PHONE_ID) {
      try {
        await axios.post(
          META_API_URL,
          {
            messaging_product: 'whatsapp',
            to: phone.replace('+', ''),
            type: 'text',
            text: { body: message },
          },
          {
            headers: {
              Authorization: `Bearer ${META_TOKEN}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        logger.debug('WhatsApp message sent via Meta', { phone: phone.slice(-4) });
        return true;
      } catch (error) {
        logger.warn('Meta WhatsApp failed, trying Twilio fallback:', error.message);
      }
    }

    // Twilio fallback
    return WhatsAppService._sendViaTwilio(phone, message);
  },

  /**
   * Send interactive button message (up to 3 buttons).
   * @param {string} phone
   * @param {string} body — message body text
   * @param {Array<{id: string, title: string}>} buttons — max 3
   * @returns {Promise<boolean>}
   */
  async sendInteractiveButtons(phone, body, buttons) {
    if (!META_TOKEN || !META_PHONE_ID) {
      // Fallback to plain text with numbered options
      const fallback = body + '\n\n' + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
      return WhatsAppService.sendMessage(phone, fallback);
    }

    try {
      await axios.post(
        META_API_URL,
        {
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: body },
            action: {
              buttons: buttons.slice(0, 3).map(b => ({
                type: 'reply',
                reply: { id: b.id, title: b.title.substring(0, 20) },
              })),
            },
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
    } catch (error) {
      logger.warn('Interactive buttons failed, sending text fallback:', error.message);
      const fallback = body + '\n\n' + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
      return WhatsAppService.sendMessage(phone, fallback);
    }
  },

  /**
   * Send interactive list message (menu with sections).
   * @param {string} phone
   * @param {string} body
   * @param {string} buttonText — text on the list button
   * @param {Array<{title: string, rows: Array<{id: string, title: string, description?: string}>}>} sections
   * @returns {Promise<boolean>}
   */
  async sendInteractiveList(phone, body, buttonText, sections) {
    if (!META_TOKEN || !META_PHONE_ID) {
      let fallback = body + '\n\n';
      for (const section of sections) {
        fallback += `*${section.title}*\n`;
        for (const row of section.rows) {
          fallback += `  • ${row.title}${row.description ? ' — ' + row.description : ''}\n`;
        }
        fallback += '\n';
      }
      return WhatsAppService.sendMessage(phone, fallback);
    }

    try {
      await axios.post(
        META_API_URL,
        {
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: body },
            action: {
              button: buttonText.substring(0, 20),
              sections: sections.map(s => ({
                title: s.title.substring(0, 24),
                rows: s.rows.slice(0, 10).map(r => ({
                  id: r.id,
                  title: r.title.substring(0, 24),
                  description: (r.description || '').substring(0, 72),
                })),
              })),
            },
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
    } catch (error) {
      logger.warn('Interactive list failed, sending text fallback:', error.message);
      let fallback = body + '\n';
      for (const section of sections) {
        fallback += `\n*${section.title}*\n`;
        for (const row of section.rows) {
          fallback += `  • ${row.title}\n`;
        }
      }
      return WhatsAppService.sendMessage(phone, fallback);
    }
  },

  /**
   * Send a template message (required for first-contact within 24h window).
   * @param {string} phone
   * @param {string} templateName
   * @param {Array<{type: string, text: string}>} params — template parameters
   * @returns {Promise<boolean>}
   */
  async sendTemplate(phone, templateName, params = []) {
    if (!META_TOKEN || !META_PHONE_ID) {
      logger.warn('Meta WhatsApp not configured — template message skipped');
      return false;
    }

    try {
      const components = params.length
        ? [
          {
            type: 'body',
            parameters: params.map((p) => ({ type: 'text', text: p.text || p })),
          },
        ]
        : [];

      await axios.post(
        META_API_URL,
        {
          messaging_product: 'whatsapp',
          to: phone.replace('+', ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
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

      logger.debug('WhatsApp template sent', { phone: phone.slice(-4), template: templateName });
      return true;
    } catch (error) {
      logger.error('WhatsApp template send failed:', error.message);
      return false;
    }
  },

  /**
   * Internal: Send via Twilio WhatsApp.
   */
  async _sendViaTwilio(phone, message) {
    if (!twilioClient || !TWILIO_WA_NUMBER) {
      logger.warn('Twilio WhatsApp not configured');
      return false;
    }

    try {
      await twilioClient.messages.create({
        body: message,
        from: TWILIO_WA_NUMBER,
        to: `whatsapp:${phone}`,
      });

      logger.debug('WhatsApp message sent via Twilio', { phone: phone.slice(-4) });
      return true;
    } catch (error) {
      logger.error('Twilio WhatsApp send failed:', error.message);
      return false;
    }
  },
};

module.exports = WhatsAppService;
