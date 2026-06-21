import { NextResponse }   from 'next/server';
import { cookies }        from 'next/headers';
import { randomBytes }    from 'crypto';
import { parseSession }   from '@/lib/session';
import { signDashboardSession } from '@/lib/dashboardSession';
import { query, queryOne } from '@/lib/db';
import type { Tier }      from '@/lib/tiers';

interface SponsorRow { tier: Tier; active: number; }
interface GuildRow   { guild_id: string; api_key: string; tier: Tier; github_username: string | null; }

function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;

  // Must have completed both GitHub and Discord steps
  if (!session?.githubUsername || !session?.guilds || !session?.discordUserId) {
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

  // Check if this guild is already registered by a DIFFERENT GitHub account
  const existingGuild = await queryOne<GuildRow>(
    `SELECT guild_id, api_key, tier, github_username FROM ticketbot_guilds WHERE guild_id = ?`,
    [guildId],
  );

  if (existingGuild && existingGuild.github_username !== null &&
      existingGuild.github_username !== session.githubUsername) {
    return NextResponse.json({ error: 'This server is already registered to another account.' }, { status: 409 });
  }

  // Check sponsor tier from the sponsors lookup table
  const sponsor = await queryOne<SponsorRow>(
    `SELECT tier, active FROM ticketbot_sponsors WHERE github_username = ? AND active = TRUE`,
    [session.githubUsername],
  );
  const tier: Tier = sponsor?.tier ?? 'basic';

  let apiKey: string;

  if (existingGuild) {
    // Guild exists — update tier, github_username, discord_user_id and reset API key
    apiKey = generateApiKey();
    await query(
      `UPDATE ticketbot_guilds
       SET tier = ?, github_username = ?, discord_user_id = ?, api_key = ?, active = TRUE, expires_at = NULL
       WHERE guild_id = ?`,
      [tier, session.githubUsername, session.discordUserId, apiKey, guildId],
    );
  } else {
    // New guild — create record
    apiKey = generateApiKey();
    await query(
      `INSERT INTO ticketbot_guilds (guild_id, api_key, tier, github_username, discord_user_id, active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [guildId, apiKey, tier, session.githubUsername, session.discordUserId],
    );
  }

  // Clear the verify session cookie — flow is complete
  const dashboardToken = signDashboardSession({ guildId, githubUsername: session.githubUsername });
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
