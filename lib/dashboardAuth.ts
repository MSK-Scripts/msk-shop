import { cookies }               from 'next/headers';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { queryOne }              from '@/lib/db';
import { trustedGuildId }        from '@/lib/guildScope';
import type { ScopedGuildId }    from '@/lib/guildScope';
import { accessState }           from '@/lib/guildAccess';
import type { Tier }             from '@/lib/tiers';

// ── Account-scoped dashboard authorization ───────────────────────────────────
//
// The dashboard session is bound to a person (Discord user id), not a single
// guild. A person may own several guilds, so every guild-scoped action must (a)
// read the target guild id from the request and (b) prove the session's Discord
// user actually owns that guild. `authorizeGuild()` does both in one place.

const GUILD_ID_RE = /^\d{17,20}$/;

export interface DashboardGuild {
  guild_id:               string;
  tier:                   Tier;
  custom_domain:          string | null;
  domain_status:          'none' | 'pending_dns' | 'active';
  is_hosted:              number;
  active:                 number;
  stripe_customer_id:     string | null;
  stripe_subscription_id: string | null;
  bot_port:               number | null;
  /** Generated subdomain of the hosted bot's own dashboard. */
  dashboard_host:          string | null;
  /** The customer's own domain for that dashboard; wins over dashboard_host. */
  dashboard_domain:        string | null;
  dashboard_domain_status: 'none' | 'pending_dns' | 'active';
  /** Raw access columns; interpreted by `accessState()`, see lib/guildAccess.ts. */
  access_checked_at:       unknown;
  access_lost_at:          unknown;
}

/** Discord user id from the signed dashboard session cookie, or null. */
export async function getDashboardUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;
  return session?.discordUserId ?? null;
}

export type GuildAuthResult =
  // `guildId` is the branded version of `guild.guild_id`. It is the only way
  // (besides `trustedGuildId()`) to get a `ScopedGuildId`, and with it
  // everything that requires one. See lib/guildScope.ts.
  | { ok: true;  discordUserId: string; guild: DashboardGuild; guildId: ScopedGuildId }
  | { ok: false; status: number; error: string };

/**
 * Authorize a guild-scoped dashboard action. Requires a valid dashboard session
 * AND that `guildId` is owned by that session's Discord user. Returns the guild
 * row on success so callers don't need a second query.
 */
export async function authorizeGuild(guildId: string | null | undefined): Promise<GuildAuthResult> {
  const discordUserId = await getDashboardUserId();
  if (!discordUserId) return { ok: false, status: 401, error: 'Not authenticated.' };

  const id = String(guildId ?? '').trim();
  if (!GUILD_ID_RE.test(id)) return { ok: false, status: 400, error: 'Invalid guild id.' };

  const guild = await queryOne<DashboardGuild>(
    `SELECT guild_id, tier, custom_domain, domain_status, is_hosted, active,
            stripe_customer_id, stripe_subscription_id, bot_port,
            dashboard_host, dashboard_domain, dashboard_domain_status,
            access_checked_at, access_lost_at
       FROM ticketbot_guilds
      WHERE guild_id = ? AND discord_user_id = ?`,
    [id, discordUserId],
  );
  if (!guild) return { ok: false, status: 403, error: 'Unauthorized guild.' };

  // Owning the row is not enough: the session's Discord user must still
  // administer the guild. Hiding a revoked guild in the dashboard would be
  // cosmetic on its own - every route that acts on a guild comes through here,
  // so this is where it has to bite. A guild inside its grace period still
  // passes; only 'revoked' is refused, and the dashboard warns long before.
  if (accessState(guild) === 'revoked') {
    return { ok: false, status: 403, error: 'access_revoked' };
  }

  // From here on the id is proven: it comes from a row that was restricted to
  // the session user. `guild.guild_id` comes from the database, so the format
  // check in `trustedGuildId` cannot fail.
  return { ok: true, discordUserId, guild, guildId: trustedGuildId(guild.guild_id, 'dashboard-session') };
}
