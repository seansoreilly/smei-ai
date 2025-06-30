import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitTier } from './rate-limiter';
import { getSession } from './sessions';

export interface ApiContext {
  isAuthenticated: boolean;
  userId?: string;
  sessionData?: Record<string, unknown>;
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

export function withRateLimit(handler: ApiHandler) {
  return async function(request: NextRequest): Promise<NextResponse> {
    const API_SECRET = process.env.API_SECRET;
    const apiKey = request.headers.get('x-api-key');
    const sessionCookie = request.cookies.get('sid');
    
    let isAuthenticated = false;
    let userId: string | undefined;
    let sessionData: Record<string, unknown> | undefined;

    // Check authentication
    if (apiKey === API_SECRET) {
      isAuthenticated = true;
      userId = 'api-key-user';
    } else if (sessionCookie) {
      const session = await getSession(sessionCookie.value);
      if (session) {
        isAuthenticated = true;
        userId = session.user_id;
        sessionData = session;
      }
    }

    // Apply rate limiting
    try {
      const pathname = new URL(request.url).pathname;
      const identifier = userId || 
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') ||
        'unknown';
      const tier = getRateLimitTier(pathname, isAuthenticated);
      
      const rateLimitResult = await checkRateLimit(identifier, tier);
      
      if (!rateLimitResult.success) {
        const response = new NextResponse(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter 
          }),
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
        if (rateLimitResult.retryAfter) {
          response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
        }
        
        return response;
      }
      
      // Call the actual handler
      const response = await handler(request, { 
        isAuthenticated, 
        userId, 
        sessionData 
      });
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
      
      return response;
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, continue without it
      return handler(request, { isAuthenticated, userId, sessionData });
    }
  };
}

export function withAuth(handler: ApiHandler) {
  return async function(request: NextRequest): Promise<NextResponse> {
    const API_SECRET = process.env.API_SECRET;
    const apiKey = request.headers.get('x-api-key');
    const sessionCookie = request.cookies.get('sid');
    
    let isAuthenticated = false;
    let userId: string | undefined;
    let sessionData: Record<string, unknown> | undefined;

    // Check authentication
    if (apiKey === API_SECRET) {
      isAuthenticated = true;
      userId = 'api-key-user';
    } else if (sessionCookie) {
      const session = await getSession(sessionCookie.value);
      if (session) {
        isAuthenticated = true;
        userId = session.user_id;
        sessionData = session;
      }
    }

    if (!isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    return handler(request, { isAuthenticated, userId, sessionData });
  };
}

export function withAuthAndRateLimit(handler: ApiHandler) {
  return withRateLimit(withAuth(handler));
} 