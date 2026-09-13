import { NextResponse }                      from 'next/server';
import { cookies }                           from 'next/headers';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { controlPost }                       from '@/lib/giveawayControl';

// Write proxy to the bot control endpoint. guildId ALWAYS comes from the session,
// never from the client body. Only whitelisted actions are allowed.
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
  // Giveaway templates. The same service as /gtemplate in the bot, so the bot
  // also checks here what a valid template is.
  templateSave:   '/template/save',
  templateDelete: '/template/delete',
  // Save an existing giveaway as a template. The bot builds the template from
  // the record, only the giveaway ID and the name are sent from here.
  templateFrom:   '/template/from',
  // The guild's Tebex store. The bot only allows these paths for the guild
  // owner and checks that itself against guild.ownerId.
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

  // Strip action, guildId and userId from the client body. All three are set
  // exclusively by the server from the signed session; otherwise someone could
  // pose as the guild owner with somebody else's userId.
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
