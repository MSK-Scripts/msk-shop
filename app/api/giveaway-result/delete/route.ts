import { NextResponse }   from 'next/server';
import { timingSafeEqual } from 'crypto';
import { deleteResultPages, GUILD_ID } from '@/lib/giveawayResults';

// Deletes all public result pages of a guild, called by the bot when it is
// removed from a server (data deletion). Auth as in /publish.
const SECRET = process.env.GIVEAWAY_RESULT_SECRET ?? '';

function authorized(req: Request): boolean {
  if (!SECRET) return false;
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let guildId: string;
  try {
    const body = await req.json();
    guildId = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!GUILD_ID.test(guildId)) {
    return NextResponse.json({ error: 'invalid_guild' }, { status: 400 });
  }

  await deleteResultPages(guildId);
  return NextResponse.json({ success: true });
}
