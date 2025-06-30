import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitTier } from './rate-limiter';

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'X-RateLimit-Error'?: string;
  'Retry-After'?: string;
}

export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number,
  error?: string,
  retryAfter?: number
): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
  
  if (error) {
    headers['X-RateLimit-Error'] = error;
  }
  
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }
  
  return headers;
}

export function getClientIdentifier(request: NextRequest): string {
  // Try to get the real IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

export function getUserIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to API key hash if available
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    // Create a simple hash of the API key
    const hash = Buffer.from(apiKey).toString('base64').slice(0, 10);
    return `key:${hash}`;
  }
  
  return getClientIdentifier(request);
}

export async function applyRateLimit(
  request: NextRequest,
  isAuthenticated: boolean,
  userId?: string
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  
  // Skip rate limiting for non-API routes
  if (!pathname.startsWith('/api')) {
    return null;
  }
  
  const identifier = isAuthenticated 
    ? getUserIdentifier(request, userId)
    : getClientIdentifier(request);
  
  const tier = getRateLimitTier(pathname, isAuthenticated);
  
  try {
    const result = await checkRateLimit(identifier, tier);
    
    const headers = createRateLimitHeaders(
      result.limit,
      result.remaining,
      result.reset,
      result.success ? undefined : 'Rate limit exceeded',
      result.retryAfter
    );
    
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      );
    }
    
    // Store headers to add to successful response
    return NextResponse.next({
      headers: headers as unknown as Record<string, string>
    });
    
  } catch (error) {
    console.error('Rate limiting failed:', error);
    
    // Fail-safe: allow request but indicate rate limiting is unavailable
    return NextResponse.next({
      headers: createRateLimitHeaders(
        tier.max,
        tier.max - 1,
        Date.now() + tier.window * 1000,
        'unavailable'
      ) as unknown as Record<string, string>
    });
  }
}