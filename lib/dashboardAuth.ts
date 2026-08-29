import { cookies }               from 'next/headers';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { queryOne }              from '@/lib/db';
import { trustedGuildId }        from '@/lib/guildScope';
import type { ScopedGuildId }    from '@/lib/guildScope';
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
}

/** Discord user id from the signed dashboard session cookie, or null. */
export async function getDashboardUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;
  return session?.discordUserId ?? null;
}

export type GuildAuthResult =
  // `guildId` ist die gebrandete Fassung von `guild.guild_id`. Sie ist der
  // einzige Weg (neben `trustedGuildId()`), an einen `ScopedGuildId` zu kommen,
  // und damit an alles, was einen verlangt. Siehe lib/guildScope.ts.
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
            dashboard_host, dashboard_domain, dashboard_domain_status
       FROM ticketbot_guilds
      WHERE guild_id = ? AND discord_user_id = ?`,
    [id, discordUserId],
  );
  if (!guild) return { ok: false, status: 403, error: 'Unauthorized guild.' };

  // Ab hier ist die Id belegt: sie stammt aus einer Zeile, die auf den
  // Session-Nutzer eingeschränkt war. `guild.guild_id` kommt aus der Datenbank,
  // die Formatprüfung von `trustedGuildId` kann also nicht fehlschlagen.
  return { ok: true, discordUserId, guild, guildId: trustedGuildId(guild.guild_id, 'dashboard-session') };
}
