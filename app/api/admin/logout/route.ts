import { NextResponse }         from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

// Clears the admin session cookie. POST to avoid CSRF via simple GET requests.
export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true });
  res.cookies.delete({ name: ADMIN_SESSION_COOKIE, path: '/' });
  return res;
}
