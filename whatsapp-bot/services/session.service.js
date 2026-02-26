// ============================================================
// Session Service — Redis conversation state management
// Key: wa_session:{phone}
// Value: JSON { intent, step, data, lang, expiresAt }
// TTL: SESSION_TTL_SECONDS (default 600 = 10 min)
// ============================================================

const Redis = require('ioredis');
const logger = require('../utils/logger');

const TTL = parseInt(process.env.SESSION_TTL_SECONDS || '600', 10);

let redis = null;

function getRedis() {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        redis.on('error', (err) => logger.error('Session Redis error:', err.message));
        redis.on('connect', () => logger.info('Session Redis connected'));
    }
    return redis;
}

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
            const raw = await getRedis().get(sessionKey(phone));
            return raw ? JSON.parse(raw) : null;
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
            await getRedis().set(sessionKey(phone), JSON.stringify(payload), 'EX', ttl);
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
            await getRedis().del(sessionKey(phone));
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
