const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
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

module.exports = redis;
