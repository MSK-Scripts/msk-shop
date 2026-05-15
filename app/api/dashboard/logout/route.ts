import { NextResponse } from 'next/server';

// ── Dashboard Logout ───────────────────────────────────────────────────────────
//
// Clears the dashboard session cookie so the customer can re-authenticate
// against another guild (useful when a customer hosts multiple bots).
// POST is used to prevent CSRF triggering via simple GET requests.

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true });

  res.cookies.delete({ name: 'msk_dashboard_session', path: '/' });
  // Cleanup: also drop any leftover verify session so /verify starts fresh.
  res.cookies.delete({ name: 'msk_verify_session',    path: '/' });

  return res;
}
