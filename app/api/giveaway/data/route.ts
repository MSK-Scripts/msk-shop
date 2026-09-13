import { NextResponse }                      from 'next/server';
import { cookies }                           from 'next/headers';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { controlGet }                        from '@/lib/giveawayControl';
import { query }                             from '@/lib/db';

// Read proxy to the bot control endpoint. guildId ALWAYS comes from the session.
const ALLOWED = new Set(['giveaways', 'giveaway', 'settings', 'roles', 'channels', 'templates', 'tebex', 'tebexPackages']);

// The bot checks these queries against guild.ownerId, for which it needs the
// user's Discord ID. It comes from the signed session, never from the query.
const OWNER_KINDS = new Set(['tebex', 'tebexPackages']);
const KIND_PATH: Record<string, string> = {
  giveaways:     '/giveaways',
  tebex:         '/tebex',
  tebexPackages: '/tebex/packages',
};

interface GwListItem { id: string; [k: string]: unknown }

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const session = parseGiveawaySession(cookieStore.get(GIVEAWAY_SESSION_COOKIE)?.value);
  if (!session?.guildId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kind = String(searchParams.get('kind') ?? '');
  if (!ALLOWED.has(kind)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 });
  }

  // An id is only passed through for /giveaway.
  const search: Record<string, string> = {};
  if (kind === 'giveaway') {
    const id = String(searchParams.get('id') ?? '').trim().toUpperCase();
    if (id) search.id = id;
  }

  if (OWNER_KINDS.has(kind)) {
    if (!session.userId) {
      // Session from before the owner flag existed: sign in again instead of
      // bothering the bot with an empty userId.
      return NextResponse.json({ error: 'reauth_required' }, { status: 401 });
    }
    search.userId = session.userId;
  }

  const path = KIND_PATH[kind] ?? `/${kind}`;
  const { status, data } = await controlGet(session.guildId, path, search);

  // Enrich the list with the link to the public result page (the token lives
  // in the shop DB, not with the bot), for finished giveaways in the dashboard.
  if (kind === 'giveaways' && status === 200) {
    const payload = data as { giveaways?: GwListItem[] } | null;
    if (payload?.giveaways?.length) {
      const rows = await query<{ giveaway_id: string; token: string }>(
        'SELECT giveaway_id, token FROM giveaway_results WHERE guild_id = ?',
        [session.guildId],
      );
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de';
      const byId = new Map(rows.map((r) => [r.giveaway_id, r.token] as const));
      payload.giveaways = payload.giveaways.map((g) => {
        const token = byId.get(g.id);
        return token ? { ...g, resultUrl: `${base}/giveaway/g/${token}` } : g;
      });
      return NextResponse.json(payload, { status });
    }
  }

  return NextResponse.json(data ?? {}, { status });
}
