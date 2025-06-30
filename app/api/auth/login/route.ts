import { NextResponse } from 'next/server';
import { createSession } from '@/lib/sessions';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  // In a real application, you would look up the user in the database
  // and use a library like bcrypt to compare the hashed password.
  if (username === 'admin' && password === 'password') {
    const session = await createSession(username);

    const response = NextResponse.json({ message: 'Login successful' });

    response.cookies.set('sid', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } 

  return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
}
