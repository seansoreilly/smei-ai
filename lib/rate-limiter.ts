// Dynamic imports to avoid Edge Runtime bundling issues
let RedisClient: typeof import('redis') | null = null;
let redisUtils: typeof import('./redis') | null = null;

// Lazy load Redis modules only when needed
async function getRedisModules(): Promise<{ RedisClient: typeof import('redis'); redisUtils: typeof import('./redis') } | null> {
  if (!RedisClient || !redisUtils) {
    try {
      const redisModule = await import('./redis');
      redisUtils = redisModule;
      const redis = await import('redis');
      RedisClient = redis;
    } catch (error) {
      console.warn('Redis modules not available:', error);
      return null;
    }
  }
  return { RedisClient, redisUtils };
}

export interface RateLimitConfig {
  identifier: string;
  max: number;
  windowSeconds: number;
}

// Rate limit tiers
export const RATE_LIMITS = {
  UNAUTH: { max: 5, window: 60 },     // 5 requests per minute for unauthenticated
  AUTH: { max: 60, window: 60 },      // 60 requests per minute for authenticated
  CONVO: { max: 20, window: 60 },     // 20 requests per minute for conversation endpoints
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// In-memory fallback for Edge Runtime
const memoryStore = new Map<string, Array<{ timestamp: number; id: string }>>();

/**
 * In-memory sliding window rate limiter fallback
 */
function inMemorySlidingWindowRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { success: boolean; count: number; reset: number } {
  const now = Date.now();
  const window = windowSeconds * 1000;
  const windowStart = now - window;
  
  // Get or create entry array
  let entries = memoryStore.get(key) || [];
  
  // Remove expired entries
  entries = entries.filter(entry => entry.timestamp > windowStart);
  
  // Add current request
  entries.push({ timestamp: now, id: `${now}-${Math.random()}` });
  
  // Update store
  memoryStore.set(key, entries);
  
  // Clean up old keys periodically (simple cleanup)
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [storeKey, storeEntries] of memoryStore.entries()) {
      const validEntries = storeEntries.filter(entry => entry.timestamp > windowStart);
      if (validEntries.length === 0) {
        memoryStore.delete(storeKey);
      } else {
        memoryStore.set(storeKey, validEntries);
      }
    }
  }
  
  const count = entries.length;
  const success = count <= limit;
  const reset = now + window;
  
  return { success, count, reset };
}

/**
 * Redis sliding window rate limiter implementation
 */
async function redisSlidingWindowRateLimit(
  redis: import('redis').RedisClientType,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; count: number; reset: number }> {
  const now = Date.now();
  const window = windowSeconds * 1000;
  const windowStart = now - window;
  
  // Use a Redis transaction to ensure atomicity
  const multi = redis.multi();
  
  // Remove expired entries
  multi.zRemRangeByScore(key, 0, windowStart);
  
  // Count current entries in the window
  multi.zCard(key);
  
  // Add current request
  multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
  
  // Set expiration on the key
  multi.expire(key, windowSeconds * 2); // Set expiration to 2x window to be safe
  
  const results = await multi.exec();
  
  if (!results) {
    throw new Error('Redis transaction failed');
  }
  
  const count = Number(results[1]) + 1; // +1 for the current request we just added
  const success = count <= limit;
  const reset = now + window;
  
  return { success, count, reset };
}

export async function checkRateLimit(
  identifier: string,
  limit: { max: number; window: number }
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}:${limit.max}:${limit.window}`;
  
  try {
    // Try to load Redis modules dynamically
    const modules = await getRedisModules();
    
    if (modules && modules.redisUtils?.isRedisConfigured()) {
      // Use Redis if available and configured
      const redis = await modules.redisUtils.getRedisClient();
      const result = await redisSlidingWindowRateLimit(
        redis,
        key,
        limit.max,
        limit.window
      );
      
      const remaining = Math.max(0, limit.max - result.count);
      
      return {
        success: result.success,
        limit: limit.max,
        remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } else {
      // Fall back to in-memory rate limiting
      console.warn('Using in-memory rate limiting (Redis not available/configured)');
      const result = inMemorySlidingWindowRateLimit(key, limit.max, limit.window);
      
      const remaining = Math.max(0, limit.max - result.count);
      
      return {
        success: result.success,
        limit: limit.max,
        remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    }
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail-safe: allow the request if both Redis and memory limiting fail
    return {
      success: true,
      limit: limit.max,
      remaining: limit.max - 1,
      reset: Date.now() + limit.window * 1000,
    };
  }
}

export function getRateLimitTier(
  pathname: string,
  isAuthenticated: boolean
): { max: number; window: number } {
  // Heavy conversation endpoints
  if (pathname.includes('/api/chat') || 
      pathname.includes('/api/conversation') || 
      pathname.includes('/api/messages')) {
    return isAuthenticated ? RATE_LIMITS.CONVO : RATE_LIMITS.UNAUTH;
  }
  
  // Regular API endpoints
  return isAuthenticated ? RATE_LIMITS.AUTH : RATE_LIMITS.UNAUTH;
}