import { NextResponse }                      from 'next/server';
import { cookies }                           from 'next/headers';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { controlPost }                       from '@/lib/giveawayControl';
import { deleteResultPages, GIVEAWAY_ID }    from '@/lib/giveawayResults';
import { BOT_LANGS }                         from '@/app/[lang]/dashboard/giveaway-bot/giveawayModel';

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
  // Since the scheduling release of the bot; an older bot answers 404.
  // Deleting is allowed there for ENDED, CANCELLED and SCHEDULED only, the
  // preview writes nothing and posts nothing.
  delete:   '/giveaway/delete',
  preview:  '/giveaway/preview',
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

  // The id of a deletion also reaches the shop database below, so it is held
  // to the bot's own shape here and not only there.
  if (action === 'delete') {
    const id = String(payload.id ?? '').trim().toUpperCase();
    if (!GIVEAWAY_ID.test(id)) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    payload.id = id;
  }
  if (action === 'preview' && payload.lang != null && payload.lang !== '') {
    if (!(BOT_LANGS as readonly string[]).includes(String(payload.lang))) {
      return NextResponse.json({ error: 'invalid_lang' }, { status: 400 });
    }
  }

  const { status, data } = await controlPost(session.guildId, path, payload);

  // The bot deleted the giveaway of this guild: its public result page goes
  // too. Only after the bot confirmed, and only within the session's guild, so
  // an id from the client can never reach a page of another server. A failure
  // here leaves the giveaway deleted; the dashboard says the page is still up.
  if (action === 'delete' && status === 200 && (data as { ok?: unknown } | null)?.ok === true) {
    let resultPage: 'deleted' | 'failed' = 'deleted';
    try {
      await deleteResultPages(session.guildId, payload.id as string);
    } catch (err) {
      console.error('[giveaway/action] result page not deleted:', err);
      resultPage = 'failed';
    }
    return NextResponse.json({ ...(data as Record<string, unknown>), resultPage }, { status });
  }

  return NextResponse.json(data ?? {}, { status });
}
