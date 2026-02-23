// ============================================================
// Redis Client Setup — cache, queues, pub/sub
// Falls back to in-memory mock when Redis is unavailable (dev)
// ============================================================

const logger = require('../utils/logger.utils');

const REDIS_URL = process.env.REDIS_URL || '';
const USE_REDIS = REDIS_URL && !REDIS_URL.includes('mock') && REDIS_URL.startsWith('redis');

// ---- In-memory mock for dev (no Redis needed) ----
class MemoryRedis {
  constructor() { this._store = new Map(); this._ttls = new Map(); }
  async connect() {}
  async quit() {}
  async get(k) { if (this._ttls.has(k) && Date.now() > this._ttls.get(k)) { this._store.delete(k); this._ttls.delete(k); return null; } return this._store.get(k) || null; }
  async set(k, v, ...args) { this._store.set(k, v); if (args[0] === 'EX') this._ttls.set(k, Date.now() + args[1] * 1000); return 'OK'; }
  async setex(k, ttl, v) { this._store.set(k, v); this._ttls.set(k, Date.now() + ttl * 1000); return 'OK'; }
  async del(...keys) { keys.forEach(k => { this._store.delete(k); this._ttls.delete(k); }); return keys.length; }
  async keys(pattern) { const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$'); return [...this._store.keys()].filter(k => re.test(k)); }
  async incr(k) { const v = Number(this._store.get(k) || 0) + 1; this._store.set(k, String(v)); return v; }
  async expire(k, s) { this._ttls.set(k, Date.now() + s * 1000); return 1; }
  async ttl(k) { if (!this._ttls.has(k)) return -1; return Math.max(0, Math.ceil((this._ttls.get(k) - Date.now()) / 1000)); }
  async lpush(k, ...vals) { const arr = JSON.parse(this._store.get(k) || '[]'); arr.unshift(...vals); this._store.set(k, JSON.stringify(arr)); return arr.length; }
  async lrange(k, s, e) { const arr = JSON.parse(this._store.get(k) || '[]'); return arr.slice(s, e === -1 ? undefined : e + 1); }
  async ltrim(k, s, e) { const arr = JSON.parse(this._store.get(k) || '[]'); this._store.set(k, JSON.stringify(arr.slice(s, e === -1 ? undefined : e + 1))); return 'OK'; }
  async hset(k, f, v) { const h = JSON.parse(this._store.get(k) || '{}'); h[f] = v; this._store.set(k, JSON.stringify(h)); return 1; }
  async hget(k, f) { const h = JSON.parse(this._store.get(k) || '{}'); return h[f] || null; }
  async hgetall(k) { return JSON.parse(this._store.get(k) || '{}'); }
  async hincrby(k, f, inc) { const h = JSON.parse(this._store.get(k) || '{}'); h[f] = (Number(h[f]) || 0) + inc; this._store.set(k, JSON.stringify(h)); return h[f]; }
  async hdel(k, ...fields) { const h = JSON.parse(this._store.get(k) || '{}'); fields.forEach(f => delete h[f]); this._store.set(k, JSON.stringify(h)); return fields.length; }
  async exists(k) { return this._store.has(k) ? 1 : 0; }
  async decr(k) { const v = Number(this._store.get(k) || 0) - 1; this._store.set(k, String(v)); return v; }
  async pexpire(k, ms) { this._ttls.set(k, Date.now() + ms); return 1; }
  async pttl(k) { if (!this._ttls.has(k)) return -1; return Math.max(0, Math.ceil(this._ttls.get(k) - Date.now())); }
  multi() {
    const self = this;
    const cmds = [];
    const chain = {
      incr(k)    { cmds.push(['incr', k]); return chain; },
      decr(k)    { cmds.push(['decr', k]); return chain; },
      pttl(k)    { cmds.push(['pttl', k]); return chain; },
      pexpire(k, ms) { cmds.push(['pexpire', k, ms]); return chain; },
      get(k)     { cmds.push(['get', k]); return chain; },
      set(...a)  { cmds.push(['set', ...a]); return chain; },
      del(...a)  { cmds.push(['del', ...a]); return chain; },
      expire(k, s) { cmds.push(['expire', k, s]); return chain; },
      hset(k, f, v) { cmds.push(['hset', k, f, v]); return chain; },
      hget(k, f) { cmds.push(['hget', k, f]); return chain; },
      setex(k, ttl, v) { cmds.push(['setex', k, ttl, v]); return chain; },
      async exec() {
        const results = [];
        for (const [cmd, ...args] of cmds) {
          try { results.push([null, await self[cmd](...args)]); }
          catch (e) { results.push([e, null]); }
        }
        return results;
      },
    };
    return chain;
  }
  on() { return this; }
}

let redisClient, redisPubSub;

if (USE_REDIS) {
  const Redis = require('ioredis');

  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) { return Math.min(times * 200, 5000); },
    lazyConnect: true,
  });

  redisPubSub = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) { return Math.min(times * 200, 5000); },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => logger.error('Redis client error: ' + err.message));
  redisClient.on('connect', () => logger.info('Redis client connected'));
  redisPubSub.on('error', (err) => logger.error('Redis pub/sub error: ' + err.message));
  redisPubSub.on('connect', () => logger.info('Redis pub/sub connected'));
} else {
  redisClient = new MemoryRedis();
  redisPubSub = new MemoryRedis();
  logger.info('Using in-memory Redis mock (set REDIS_URL for real Redis)');
}

async function connectRedis() {
  try {
    await Promise.all([redisClient.connect(), redisPubSub.connect()]);
    if (USE_REDIS) logger.info('All Redis connections established');
  } catch (error) {
    logger.error('Redis connection failed: ' + error.message);
    throw error;
  }
}

async function disconnectRedis() {
  await Promise.all([redisClient.quit(), redisPubSub.quit()]);
  logger.info('Redis disconnected');
}

module.exports = {
  redisClient,
  redisPubSub,
  connectRedis,
  disconnectRedis,
};
