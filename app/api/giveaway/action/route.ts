import { NextResponse }                      from 'next/server';
import { cookies }                           from 'next/headers';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { controlPost }                       from '@/lib/giveawayControl';

// Schreib-Proxy zum Bot-Steuer-Endpunkt. guildId kommt IMMER aus der Session,
// nie aus dem Client-Body. Nur whitelisted Aktionen sind erlaubt.
const ACTION_PATH: Record<string, string> = {
  create:   '/giveaway/create',
  edit:     '/giveaway/edit',
  extend:   '/giveaway/extend',
  end:      '/giveaway/end',
  cancel:   '/giveaway/cancel',
  pause:    '/giveaway/pause',
  resume:   '/giveaway/resume',
  reroll:   '/giveaway/reroll',
  settings: '/settings',
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = parseGiveawaySession(cookieStore.get(GIVEAWAY_SESSION_COOKIE)?.value);
  if (!session?.guildId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const action = String(body.action ?? '');
  const path = ACTION_PATH[action];
  if (!path) {
    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  }

  // action selbst und ein evtl. mitgesendetes guildId entfernen.
  const { action: _a, guildId: _g, ...payload } = body;
  void _a; void _g;

  const { status, data } = await controlPost(session.guildId, path, payload);
  return NextResponse.json(data ?? {}, { status });
}
