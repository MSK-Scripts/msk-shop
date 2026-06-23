import { NextResponse }   from 'next/server';
import { cookies }        from 'next/headers';
import { randomBytes }    from 'crypto';
import { parseSession }   from '@/lib/session';
import { signDashboardSession } from '@/lib/dashboardSession';
import { query, queryOne } from '@/lib/db';
import type { Tier }      from '@/lib/tiers';

interface GuildRow { guild_id: string; api_key: string; tier: Tier; discord_user_id: string | null; }

function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;

  // Must have completed the Discord step (guild list + user id)
  if (!session?.guilds || !session?.discordUserId) {
    return NextResponse.json({ error: 'Incomplete verification. Please start from the beginning.' }, { status: 401 });
  }

  // Validate guild_id from body
  let guildId: string;
  try {
    const body = await req.json();
    guildId    = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Verify the user actually has access to this guild (must be in their admin guilds list)
  const guildAllowed = session.guilds.some(g => g.id === guildId);
  if (!guildAllowed || !/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ error: 'Invalid or unauthorized guild.' }, { status: 403 });
  }

  // Check if this guild is already registered by a DIFFERENT Discord account
  const existingGuild = await queryOne<GuildRow>(
    `SELECT guild_id, api_key, tier, discord_user_id FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );

  if (existingGuild && existingGuild.discord_user_id !== null &&
      existingGuild.discord_user_id !== session.discordUserId) {
    return NextResponse.json({ error: 'This server is already registered to another account.' }, { status: 409 });
  }

  // The paid tier is now driven entirely by Stripe (checkout + webhook). Re-verify
  // never changes the tier or billing fields: a new guild starts on `basic`, an
  // existing one keeps whatever tier/subscription it already has.
  const apiKey = generateApiKey();
  let tier: Tier;

  if (existingGuild) {
    // Guild exists — rotate the API key and (re)bind ownership; do NOT touch
    // tier / expires_at / stripe_* so an active subscription survives re-verify.
    tier = existingGuild.tier;
    await query(
      `UPDATE ticketbot_guilds
       SET discord_user_id = ?, api_key = ?, active = TRUE
       WHERE guild_id = ?`,
      [session.discordUserId, apiKey, guildId],
    );
  } else {
    // New guild — create record on the free tier
    tier = 'basic';
    await query(
      `INSERT INTO ticketbot_guilds (guild_id, api_key, tier, discord_user_id, active)
       VALUES (?, ?, 'basic', ?, TRUE)`,
      [guildId, apiKey, session.discordUserId],
    );
  }

  // Clear the verify session cookie — flow is complete. The dashboard session is
  // account-scoped (covers all of this user's guilds).
  const dashboardToken = signDashboardSession({ discordUserId: session.discordUserId });
  const res = NextResponse.json({ success: true, apiKey, tier });
  res.cookies.delete('msk_verify_session');
  res.cookies.set('msk_dashboard_session', dashboardToken, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     '/',
  });
  return res;
}
