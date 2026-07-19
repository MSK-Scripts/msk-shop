import { NextResponse }      from 'next/server';
import { adminRoute }        from '@/lib/adminApi';
import { writeAudit }        from '@/lib/adminAudit';
import { query, queryOne }   from '@/lib/db';
import { TIER_CONFIG, type Tier } from '@/lib/tiers';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

const VALID_TIERS = Object.keys(TIER_CONFIG) as Tier[];

// Change the tier of a ticket bot API key (identified by its guild id).
// Only the tier column is touched — billing (Stripe) and the daily cleanup's
// auto-downgrade still run as usual, so treat this as a manual override.
export const PATCH = adminRoute<{ guildId: string }>('api_key.change', async ({ req, member, params }) => {
  const guildId = params.guildId;
  if (!/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ error: 'Invalid guild id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const tier = body?.tier;
  if (typeof tier !== 'string' || !VALID_TIERS.includes(tier as Tier)) {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
  }

  const existing = await queryOne<{ tier: string }>(
    'SELECT tier FROM ticketbot_guilds WHERE guild_id = ?', [guildId],
  );
  if (!existing) {
    return NextResponse.json({ error: 'API key not found.' }, { status: 404 });
  }
  if (existing.tier === tier) {
    return NextResponse.json({ success: true, tier });
  }

  await query('UPDATE ticketbot_guilds SET tier = ? WHERE guild_id = ?', [tier, guildId]);
  await writeAudit(member.discordUserId, 'api_key.change_tier', guildId, { from: existing.tier, to: tier });

  return NextResponse.json({ success: true, tier });
});
