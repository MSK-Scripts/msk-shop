import { NextResponse }                      from 'next/server';
import { cookies }                           from 'next/headers';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { controlGet }                        from '@/lib/giveawayControl';

// Lese-Proxy zum Bot-Steuer-Endpunkt. guildId kommt IMMER aus der Session.
const ALLOWED = new Set(['giveaways', 'giveaway', 'settings', 'roles', 'channels']);

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

  // Nur für /giveaway wird eine id durchgereicht.
  const search: Record<string, string> = {};
  if (kind === 'giveaway') {
    const id = String(searchParams.get('id') ?? '').trim().toUpperCase();
    if (id) search.id = id;
  }

  const path = kind === 'giveaways' ? '/giveaways' : `/${kind}`;
  const { status, data } = await controlGet(session.guildId, path, search);
  return NextResponse.json(data ?? {}, { status });
}
