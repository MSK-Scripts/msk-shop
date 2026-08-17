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
  // Giveaway-Vorlagen. Derselbe Service wie /gtemplate im Bot, deshalb prüft
  // der Bot auch hier, was eine gültige Vorlage ist.
  templateSave:   '/template/save',
  templateDelete: '/template/delete',
  // Ein bestehendes Giveaway als Vorlage sichern. Der Bot baut die Vorlage aus
  // dem Datensatz, hier gehen nur die Giveaway-ID und der Name hin.
  templateFrom:   '/template/from',
  // Tebex-Store der Guild. Der Bot lässt diese Pfade nur für den Guild-Besitzer
  // zu und prüft das selbst gegen guild.ownerId.
  tebexSecret: '/tebex/secret',
  tebexReveal: '/tebex/reveal',
  tebexClear:  '/tebex/clear',
  tebexStore:  '/tebex/store',
};

const OWNER_ACTIONS = new Set(['tebexSecret', 'tebexReveal', 'tebexClear', 'tebexStore']);

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

  // action, guildId und userId aus dem Client-Body entfernen. Alle drei setzt
  // ausschließlich der Server aus der signierten Session — sonst könnte sich
  // jemand mit einer fremden userId als Guild-Besitzer ausgeben.
  const { action: _a, guildId: _g, userId: _u, ...payload } = body;
  void _a; void _g; void _u;

  if (OWNER_ACTIONS.has(action)) {
    if (!session.userId) {
      return NextResponse.json({ error: 'reauth_required' }, { status: 401 });
    }
    payload.userId = session.userId;
  }

  const { status, data } = await controlPost(session.guildId, path, payload);
  return NextResponse.json(data ?? {}, { status });
}
