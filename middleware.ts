import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from './lib/init-db';
import { getSession } from './lib/sessions';

let dbInitialized = false;
const API_SECRET = process.env.API_SECRET;

const publicRoutes = [
  '/api/auth/login',
  '/api/auth/logout',
];

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

  // Skip auth and rate limiting for public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin');
      const allowedOrigins = process.env.NODE_ENV === 'development' 
        ? ['http://localhost:3000', 'http://127.0.0.1:3000']
        : [process.env.VERCEL_URL].filter(Boolean);
      
      const response = new NextResponse(null, { status: 204 });
      
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else if (!origin) {
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
      
      return response;
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
    const allowedOrigins = process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000', 'http://127.0.0.1:3000']
      : [process.env.VERCEL_URL].filter(Boolean);
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Allow same-origin requests
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};