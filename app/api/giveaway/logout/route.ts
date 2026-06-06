import { NextResponse }            from 'next/server';
import { GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(GIVEAWAY_SESSION_COOKIE);
  return res;
}
