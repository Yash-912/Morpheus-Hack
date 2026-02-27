// ============================================================
// Session Service — In-memory conversation state management
// Falls back to in-memory Map when Redis not available
// Key: wa_session:{phone}
// Value: JSON { intent, step, data, lang, expiresAt }
// TTL: SESSION_TTL_SECONDS (default 600 = 10 min)
// ============================================================

const logger = require('../utils/logger');

const TTL = parseInt(process.env.SESSION_TTL_SECONDS || '600', 10);

// In-memory session store (works without Redis)
const memoryStore = new Map();

// Clean up expired sessions every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
        if (entry.expiresAt && entry.expiresAt < now) {
            memoryStore.delete(key);
        }
    }
}, 60000);

function sessionKey(phone) {
    return `wa_session:${phone}`;
}

const SessionService = {
    /**
     * Get the current session for a phone number.
     * @param {string} phone
     * @returns {Promise<object|null>}
     */
    async get(phone) {
        try {
            const key = sessionKey(phone);
            const entry = memoryStore.get(key);
            if (!entry) return null;
            // Check TTL
            if (entry.expiresAt && entry.expiresAt < Date.now()) {
                memoryStore.delete(key);
                return null;
            }
            return entry.data;
        } catch (err) {
            logger.error('Session get error:', err.message);
            return null;
        }
    },

    /**
     * Save/update session for a phone number.
     * @param {string} phone
     * @param {object} sessionData — { intent, step, data, lang }
     * @param {number} [ttl] — TTL in seconds (default from env)
     */
    async set(phone, sessionData, ttl = TTL) {
        try {
            const payload = {
                ...sessionData,
                updatedAt: new Date().toISOString(),
            };
            memoryStore.set(sessionKey(phone), {
                data: payload,
                expiresAt: Date.now() + ttl * 1000,
            });
        } catch (err) {
            logger.error('Session set error:', err.message);
        }
    },

    /**
     * Update specific fields in an existing session.
     */
    async update(phone, updates) {
        const existing = (await SessionService.get(phone)) || {};
        await SessionService.set(phone, { ...existing, ...updates });
    },

    /**
     * Delete session (conversation complete).
     */
    async clear(phone) {
        try {
            memoryStore.delete(sessionKey(phone));
        } catch (err) {
            logger.error('Session clear error:', err.message);
        }
    },

    /**
     * Check if a session is in a specific multi-step flow.
     */
    async isInFlow(phone, intent) {
        const session = await SessionService.get(phone);
        return session?.intent === intent && session?.step != null;
    },
};

module.exports = SessionService;
