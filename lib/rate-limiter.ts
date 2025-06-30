import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient, isRedisConfigured } from './redis';

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

// Cache for rate limiters to avoid creating multiple instances
const limiters = new Map<string, Ratelimit>();

export function buildLimiter({ identifier, max, windowSeconds }: RateLimitConfig): Ratelimit {
  const key = `${identifier}-${max}-${windowSeconds}`;
  
  if (limiters.has(key)) {
    return limiters.get(key)!;
  }
  
  const redis = getRedisClient();
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
    analytics: true,
  });
  
  limiters.set(key, limiter);
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  identifier: string,
  limit: { max: number; window: number }
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests but log a warning
  if (!isRedisConfigured()) {
    console.warn('Rate limiting disabled: Redis not configured');
    return {
      success: true,
      limit: limit.max,
      remaining: limit.max - 1,
      reset: Date.now() + limit.window * 1000,
    };
  }
  
  try {
    const limiter = buildLimiter({
      identifier: 'global', // Use a global namespace
      max: limit.max,
      windowSeconds: limit.window,
    });
    
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail-safe: allow the request if Redis is unavailable
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