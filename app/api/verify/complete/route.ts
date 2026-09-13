import { NextResponse }   from 'next/server';
import { cookies }        from 'next/headers';
import { randomBytes }    from 'crypto';
import { parseSession }   from '@/lib/session';
import { signDashboardSession } from '@/lib/dashboardSession';
import { query, queryOne } from '@/lib/db';
import { accessState }    from '@/lib/guildAccess';
import type { Tier }      from '@/lib/tiers';

interface GuildRow {
  guild_id:          string;
  api_key:           string;
  tier:              Tier;
  discord_user_id:   string | null;
  access_checked_at: unknown;
  access_lost_at:    unknown;
}

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
  let dpaAccepted: boolean;
  try {
    const body  = await req.json();
    guildId     = String(body.guildId ?? '').trim();
    dpaAccepted = body.dpaAccepted === true;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Data processing agreement (Art. 28 DSGVO).
  //
  // For the content of the transcripts the server operator is the controller
  // and we are the processor. Without a concluded agreement the processing
  // would not be permitted under Art. 28 Abs. 3 DSGVO, which is why consent is
  // a real condition here and not just a checkbox in the form.
  if (!dpaAccepted) {
    return NextResponse.json({ error: 'dpa_required' }, { status: 400 });
  }

  // Verify the user actually has access to this guild (must be in their admin guilds list)
  const guildAllowed = session.guilds.some(g => g.id === guildId);
  if (!guildAllowed || !/^\d{17,20}$/.test(guildId)) {
    return NextResponse.json({ error: 'Invalid or unauthorized guild.' }, { status: 403 });
  }

  // Check if this guild is already registered by a DIFFERENT Discord account
  const existingGuild = await queryOne<GuildRow>(
    `SELECT guild_id, api_key, tier, discord_user_id, access_checked_at, access_lost_at
       FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );

  const foreignOwner = Boolean(
    existingGuild &&
    existingGuild.discord_user_id !== null &&
    existingGuild.discord_user_id !== session.discordUserId,
  );

  // A guild bound to someone else normally stays theirs. The exception is the
  // one that used to be a dead end: if that person lost their Discord rights
  // and the grace period has run out, the row describes a server they can no
  // longer administer, while the requester just proved they can.
  //
  // Without this, the 409 was permanent. A server whose admin team had changed
  // could never be re-registered by the people actually running it, and the
  // only way out was someone editing the database by hand.
  //
  // Deliberately 'revoked' and not 'grace': a takeover rotates the API key and
  // hands the transcripts to a different account, so it waits out the same
  // window the previous owner is warned about. Nothing here is automatic - it
  // takes a second person completing the wizard.
  const takeoverAllowed = foreignOwner && existingGuild !== null &&
    accessState(existingGuild) === 'revoked';

  if (foreignOwner && !takeoverAllowed) {
    return NextResponse.json({ error: 'This server is already registered to another account.' }, { status: 409 });
  }

  if (takeoverAllowed) {
    console.warn(
      `[verify] guild ${guildId} taken over: ${existingGuild?.discord_user_id} -> ${session.discordUserId} (previous owner lost Discord rights)`,
    );
  }

  // The paid tier is now driven entirely by Stripe (checkout + webhook). Re-verify
  // never changes the tier or billing fields: a new guild starts on `basic`, an
  // existing one keeps whatever tier/subscription it already has.
  const apiKey = generateApiKey();
  let tier: Tier;

  // Capture the human-readable server name from the OAuth guild list so the
  // dashboard can show it instead of the raw ID. Truncated to the column length.
  const guildName = session.guilds.find(g => g.id === guildId)?.name?.slice(0, 120) ?? null;

  if (existingGuild) {
    // Guild exists: rotate the API key and (re)bind ownership; do NOT touch
    // tier / expires_at / stripe_* so an active subscription survives re-verify.
    tier = existingGuild.tier;
    // `COALESCE` keeps the first timestamp: what counts is when the agreement
    // was concluded for the first time, not when a new API key was last
    // issued.
    // The access columns are reset here because completing the wizard IS a
    // fresh, authoritative Discord check for this guild: the id only ever gets
    // this far after passing `canManageGuild` in the callback.
    await query(
      `UPDATE ticketbot_guilds
       SET discord_user_id = ?, api_key = ?, active = TRUE, guild_name = ?,
           dpa_accepted_at = COALESCE(dpa_accepted_at, NOW()),
           access_checked_at = NOW(), access_lost_at = NULL
       WHERE guild_id = ?`,
      [session.discordUserId, apiKey, guildName, guildId],
    );
  } else {
    // New guild: create record on the free tier
    tier = 'basic';
    await query(
      `INSERT INTO ticketbot_guilds
         (guild_id, api_key, tier, discord_user_id, guild_name, active, dpa_accepted_at,
          access_checked_at)
       VALUES (?, ?, 'basic', ?, ?, TRUE, NOW(), NOW())`,
      [guildId, apiKey, session.discordUserId, guildName],
    );
  }

  // Clear the verify session cookie; flow is complete. The dashboard session is
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
