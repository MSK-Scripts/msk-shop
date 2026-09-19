import { NextResponse }      from 'next/server';
import { adminRoute }        from '@/lib/adminApi';
import { writeAudit }        from '@/lib/adminAudit';
import { query, queryOne }   from '@/lib/db';
import { isKeyOrigin, type KeyOrigin } from '@/lib/keyClassification';
import { TIER_CONFIG, type Tier }      from '@/lib/tiers';

// Session-/cookie-dependent → never cache.
export const dynamic = 'force-dynamic';

const VALID_TIERS = Object.keys(TIER_CONFIG) as Tier[];

interface ExistingRow {
  tier:                   string;
  stats_excluded:         number;
  key_origin:             KeyOrigin;
  stripe_subscription_id: string | null;
}

/**
 * Change what we record about a ticket bot API key: its tier, whether it counts
 * towards the public figures, and how it came about.
 *
 * Every field is optional and only the ones present in the body are touched, so
 * the tier dropdown and the two classification controls can save independently
 * without one of them clearing the others.
 *
 * Only these columns are written. Billing (Stripe) and the daily cleanup's
 * auto-downgrade still run as usual, so a tier set here is a manual override.
 */
export const PATCH = adminRoute<{ guildId: string }>('api_key.change', async ({ req, member, params }) => {
  const guildId = params.guildId;
  if (!/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ error: 'Invalid guild id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // ── Validate whatever was sent ────────────────────────────────────────────
  const hasTier     = 'tier'          in body;
  const hasExcluded = 'statsExcluded' in body;
  const hasOrigin   = 'keyOrigin'     in body;

  if (!hasTier && !hasExcluded && !hasOrigin) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  }
  if (hasTier && (typeof body.tier !== 'string' || !VALID_TIERS.includes(body.tier as Tier))) {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
  }
  if (hasExcluded && typeof body.statsExcluded !== 'boolean') {
    return NextResponse.json({ error: 'statsExcluded must be a boolean.' }, { status: 400 });
  }
  if (hasOrigin && !isKeyOrigin(body.keyOrigin)) {
    return NextResponse.json({ error: 'Invalid key origin.' }, { status: 400 });
  }

  const existing = await queryOne<ExistingRow>(
    `SELECT tier, stats_excluded, key_origin, stripe_subscription_id
       FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );
  if (!existing) {
    return NextResponse.json({ error: 'API key not found.' }, { status: 404 });
  }

  // ── Build the update from the fields that actually differ ─────────────────
  //
  // Comparing before writing keeps the audit log meaningful: a save that
  // changes nothing should not produce a row claiming it did. The audit log is
  // the only record of who handed out which sponsored key.
  const sets:   string[] = [];
  const values: unknown[] = [];
  const audits: Array<{ action: string; detail: Record<string, unknown> }> = [];

  if (hasTier && body.tier !== existing.tier) {
    sets.push('tier = ?');
    values.push(body.tier);
    audits.push({ action: 'api_key.change_tier', detail: { from: existing.tier, to: body.tier } });
  }

  const wasExcluded = existing.stats_excluded === 1;
  if (hasExcluded && body.statsExcluded !== wasExcluded) {
    sets.push('stats_excluded = ?');
    values.push(body.statsExcluded ? 1 : 0);
    audits.push({ action: 'api_key.change_stats_excluded', detail: { from: wasExcluded, to: body.statsExcluded } });
  }

  if (hasOrigin && body.keyOrigin !== existing.key_origin) {
    sets.push('key_origin = ?');
    values.push(body.keyOrigin);
    audits.push({ action: 'api_key.change_origin', detail: { from: existing.key_origin, to: body.keyOrigin } });
  }

  if (sets.length > 0) {
    await query(`UPDATE ticketbot_guilds SET ${sets.join(', ')} WHERE guild_id = ?`, [...values, guildId]);
    for (const a of audits) await writeAudit(member.discordUserId, a.action, guildId, a.detail);
  }

  // A manual tier override on a guild with a live Stripe subscription is
  // transient: the next invoice.payment_succeeded webhook or the daily
  // stripe-reconcile run resets the tier from the subscription's price. The
  // two classification columns are ours alone and no sync touches them.
  const warning = hasTier && body.tier !== existing.tier && existing.stripe_subscription_id
    ? 'This guild has an active Stripe subscription. The manual tier will be reverted by the next billing sync. Change the subscription in Stripe for a durable change.'
    : undefined;

  return NextResponse.json({
    success:       true,
    tier:          hasTier     ? body.tier          : existing.tier,
    statsExcluded: hasExcluded ? body.statsExcluded : wasExcluded,
    keyOrigin:     hasOrigin   ? body.keyOrigin     : existing.key_origin,
    warning,
  }, { headers: { 'Cache-Control': 'no-store' } });
});
