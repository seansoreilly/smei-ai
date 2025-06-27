import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from './lib/init-db';

let dbInitialized = false;

export async function middleware(request: NextRequest) {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};