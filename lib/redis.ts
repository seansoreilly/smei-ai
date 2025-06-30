// Dynamic import to avoid bundling issues in Edge Runtime
let redisModule: typeof import('redis') | null = null;

// Lazy initialization to avoid errors in environments without Redis credentials or Edge Runtime
let redis: import('redis').RedisClientType | null = null;

// Detect if we're in an Edge Runtime environment
function isEdgeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === 'edge' ||
         typeof window !== 'undefined' ||
         (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis);
}

async function loadRedisModule(): Promise<typeof import('redis') | null> {
  if (!redisModule) {
    try {
      if (isEdgeRuntime()) {
        console.warn('Redis not available in Edge Runtime environment');
        return null;
      }
      redisModule = await import('redis');
    } catch (error) {
      console.warn('Failed to load Redis module:', error);
      return null;
    }
  }
  return redisModule;
}

export async function getRedisClient(): Promise<import('redis').RedisClientType> {
  if (isEdgeRuntime()) {
    throw new Error('Redis not available in Edge Runtime environment');
  }

  if (!redis) {
    const url = process.env.REDIS_URL;
    
    if (!url || url === 'placeholder') {
      throw new Error('Redis configuration missing. Please set REDIS_URL environment variable.');
    }

    const redisLib = await loadRedisModule();
    if (!redisLib) {
      throw new Error('Redis module not available');
    }
    
    redis = redisLib.createClient({
      url
    });

    // Connect to Redis
    await redis.connect();
  }
  
  return redis;
}

export function isRedisConfigured(): boolean {
  // Not available in Edge Runtime
  if (isEdgeRuntime()) {
    return false;
  }
  
  const url = process.env.REDIS_URL;
  return !!(url && url !== 'placeholder');
}

// Graceful cleanup function
export async function closeRedisConnection(): Promise<void> {
  if (redis && redis.isOpen) {
    await redis.quit();
    redis = null;
  }
}