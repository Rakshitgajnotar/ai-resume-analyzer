const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: process.env.REDIS_URL.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  });

  redis.on('error', (err) => {
    if (err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET')) return;
    console.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('Redis client connected for caching');
  });
} else {
  console.log('[Redis] REDIS_URL not configured. Operating with in-memory caching fallback.');
  const memoryCache = new Map();
  redis = {
    async get(key) {
      return memoryCache.get(key) || null;
    },
    async set(key, value) {
      memoryCache.set(key, value);
      return 'OK';
    },
    async del(key) {
      memoryCache.delete(key);
      return 1;
    },
    on() {},
  };
}

module.exports = redis;

