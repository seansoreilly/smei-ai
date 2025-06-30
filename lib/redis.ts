import { Redis } from '@upstash/redis';

// Lazy initialization to avoid errors in environments without Redis credentials
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token || url === 'placeholder' || token === 'placeholder') {
      throw new Error('Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
    }
    
    redis = new Redis({
      url,
      token,
    });
  }
  
  return redis;
}

export function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(url && token && url !== 'placeholder' && token !== 'placeholder');
}