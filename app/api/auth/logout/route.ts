import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/sessions';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get('sid')?.value;

  if (sessionId) {
    await deleteSession(sessionId);
  }

  const response = NextResponse.json({ message: 'Logout successful' });
  response.cookies.delete('sid');

  return response;
}
