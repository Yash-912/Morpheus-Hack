// ============================================================
// Redis Client Setup — cache, queues, pub/sub
// ============================================================

const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// General cache & Bull queue client
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  lazyConnect: true,
});

// Dedicated pub/sub client for Socket.io adapter
const redisPubSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  lazyConnect: true,
});

// Event listeners
redisClient.on('error', (err) => console.error('❌ Redis client error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis client connected'));

redisPubSub.on('error', (err) => console.error('❌ Redis pub/sub error:', err.message));
redisPubSub.on('connect', () => console.log('✅ Redis pub/sub connected'));

/**
 * Connect both Redis clients. Call at server startup.
 */
async function connectRedis() {
  try {
    await Promise.all([redisClient.connect(), redisPubSub.connect()]);
    console.log('✅ All Redis connections established');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect both Redis clients gracefully.
 */
async function disconnectRedis() {
  await Promise.all([redisClient.quit(), redisPubSub.quit()]);
  console.log('🔌 Redis disconnected');
}

module.exports = {
  redisClient,
  redisPubSub,
  connectRedis,
  disconnectRedis,
};
