import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, revokeToken } from '@/lib/auth';

export async function POST() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    revokeToken(token);
  }
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'Clear-Site-Data': '"cache", "cookies", "storage"',
      },
    }
  );

  // Invalidate session cookie across root domain
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  });

  return response;
}
