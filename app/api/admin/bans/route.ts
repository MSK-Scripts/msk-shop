import { NextResponse } from 'next/server';
import { adminRoute }   from '@/lib/adminApi';
import { writeAudit }   from '@/lib/adminAudit';
import { maskPersonalData } from '@/lib/adminMask';
import { tebexPlugin, unwrapList } from '@/lib/tebexPlugin';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

// IP and email of a ban leave masked, and so does any address in a reason
// (lib/adminMask.ts). The full IP or email is a reveal per row.
export const GET = adminRoute('bans.manage', async () => {
  const bans = unwrapList(await tebexPlugin.bans.list());
  return NextResponse.json({ bans: maskPersonalData(bans) }, { headers: { 'Cache-Control': 'no-store' } });
});

// Ban a player by username/UUID (and optionally an IP).
export const POST = adminRoute('bans.manage', async ({ req, member }) => {
  const body   = await req.json().catch(() => null);
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  const user   = typeof body?.user === 'string' ? body.user.trim() : '';
  const ip     = typeof body?.ip === 'string' ? (body.ip.trim() || undefined) : undefined;

  if (!reason) return NextResponse.json({ error: 'Reason is required.' }, { status: 400 });
  if (!user)   return NextResponse.json({ error: 'User (username or UUID) is required.' }, { status: 400 });

  const result = await tebexPlugin.bans.create(reason, user, ip);
  await writeAudit(member.discordUserId, 'ban.create', user, { reason });
  return NextResponse.json({ result });
});
