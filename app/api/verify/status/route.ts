import { NextResponse }  from 'next/server';
import { queryOne }       from '@/lib/db';
import type { Tier }      from '@/lib/tiers';

interface GuildRow { tier: Tier; active: number; }

export async function GET(req: Request): Promise<NextResponse> {
  const auth   = req.headers.get('authorization') ?? '';
  const match  = auth.match(/^Bearer\s+([A-Za-z0-9_\-]{32,128})$/);
  const apiKey = match?.[1];

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header.' }, { status: 401 });
  }

  const guild = await queryOne<GuildRow>(
    `SELECT tier, active FROM ticketbot_guilds WHERE api_key = ?`,
    [apiKey],
  );

  if (!guild || guild.active === 0) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
  }

  return NextResponse.json({ valid: true, tier: guild.tier });
}
