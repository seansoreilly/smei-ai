import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from './lib/init-db';
import { getSession } from './lib/sessions';
import { ALLOWED_ORIGINS, buildCsp, HSTS_HEADER } from './lib/config/security';

let dbInitialized = false;
const API_SECRET = process.env.API_SECRET;

const publicRoutes = [
  '/api/auth/login',
  '/api/auth/logout',
];

function addSecurityHeaders(response: NextResponse, nonce: string) {
  // Add CSP header
  response.headers.set('Content-Security-Policy', buildCsp(nonce, process.env.NODE_ENV === 'production'));
  response.headers.set('X-Nonce', nonce);
  
  // Add HSTS header (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(HSTS_HEADER.key, HSTS_HEADER.value);
  }
  
  return response;
}

export async function middleware(request: NextRequest) {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Optionally, you could return a 500 error page here
    }
  }

  const pathname = request.nextUrl.pathname;

  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'production');

  // Handle _next/image endpoint CORS
  if (pathname.startsWith('/_next/image')) {
    const origin = request.headers.get('origin') ?? '';
    const response = NextResponse.next();
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    } else {
      // Remove any pre-existing wildcard injected by default server
      response.headers.delete('Access-Control-Allow-Origin');
    }
    
    return addSecurityHeaders(response, nonce);
  }

  // Skip auth and rate limiting for public routes
  if (publicRoutes.includes(pathname)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response, nonce);
  }

  if (pathname.startsWith('/api')) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin');
      const response = new NextResponse(null, { status: 204 });
      
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
      }
      // Remove wildcard CORS - no fallback to '*'
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
      
      return addSecurityHeaders(response, nonce);
    }

    const apiKey = request.headers.get('x-api-key');
    const sessionCookie = request.cookies.get('sid');
    let isAuthenticated = false;
    let userId: string | undefined;

    // Check authentication
    if (apiKey === API_SECRET) {
      isAuthenticated = true;
      userId = 'api-key-user';
    } else if (sessionCookie) {
      const session = await getSession(sessionCookie.value);
      if (session) {
        isAuthenticated = true;
        userId = session.user_id;
      }
    }

    // If not authenticated, return 401
    if (!isAuthenticated) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Add CORS headers for API routes
    const response = NextResponse.next();
    
    // Configure CORS
    const origin = request.headers.get('origin');
    
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
    // Remove wildcard CORS - no fallback to '*'
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return addSecurityHeaders(response, nonce);
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response, nonce);
}

export const config = {
  matcher: '/((?!_next/static|favicon.ico).*)',
};