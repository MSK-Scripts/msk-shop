import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { tebexPlugin }  from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// Look up a player by username or UUID.
export const GET = adminRoute('payments.view', async ({ req }) => {
  const user = req.nextUrl.searchParams.get('user')?.trim();
  if (!user) {
    return NextResponse.json({ error: 'Missing user (username or UUID).' }, { status: 400 });
  }
  const result = await tebexPlugin.lookup.user(user);
  return NextResponse.json({ result });
});
