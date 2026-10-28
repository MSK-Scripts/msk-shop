import { cache }                 from 'react';
import { cookies }               from 'next/headers';
import { redirect }              from 'next/navigation';
import { getRequestLang }        from '@/lib/serverLang';
import { publicPath }            from '@/lib/routes';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { query }                 from '@/lib/db';
import { accessState, accessGraceEndsAt, isAccessStale } from '@/lib/guildAccess';
import type { AccessState }      from '@/lib/guildAccess';
import { RECHECK_COOKIE }        from '@/lib/accessRecheck';
import type { Lang }             from '@/lib/i18n';
import type { Tier }             from '@/lib/tiers';

export interface DashboardGuild {
  guild_id:               string;
  guild_name:             string | null;
  tier:                   Tier;
  custom_domain:          string | null;
  domain_status:          'none' | 'pending_dns' | 'active';
  is_hosted:              number;
  stripe_subscription_id: string | null;
  /** Last Stripe status mirrored by the webhook. 'trialing' drives the trial notice. */
  stripe_status:          string | null;
  /** Current subscription/trial period end, i.e. the day a running trial expires. */
  expires_at:             string | null;
  bot_port:               number | null;
  /** Generated subdomain of the hosted bot's own dashboard. */
  dashboard_host:          string | null;
  /** The customer's own domain for it; takes precedence when active. */
  dashboard_domain:        string | null;
  dashboard_domain_status: 'none' | 'pending_dns' | 'active';
  /**
   * Is the session's Discord user still an admin of this guild? Derived from
   * the two access columns, never sent raw. 'revoked' rows never reach the
   * client at all - see the filter below.
   */
  access_state:            AccessState;
  /** End of the grace period as ms epoch; null while access is fine. */
  access_grace_ends_at:    number | null;
}

/** Shape read from the database, before the access state is derived. */
interface GuildRow extends Omit<DashboardGuild, 'access_state' | 'access_grace_ends_at'> {
  access_checked_at: unknown;
  access_lost_at:    unknown;
}

/**
 * The servers of the signed-in person, for every page of the ticket bot
 * dashboard.
 *
 * Moved here unchanged from the old single `page.tsx` in Phase 7 of the
 * redesign, when the dashboard got one address per server and area. Layout
 * and page of a request both call it; `cache()` makes that one query.
 *
 * Account-scoped: the only input is the Discord user id from the signed
 * session. Nothing from the address reaches the query.
 */
export const loadTicketBotGuilds = cache(async (): Promise<{ lang: Lang; guilds: DashboardGuild[] }> => {
  // Every way out of here stays in the language of the dashboard.
  const { lang } = await getRequestLang();
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;

  if (!session?.discordUserId) {
    redirect(publicPath(lang, '/dashboard/ticket-bot/verify'));
  }

  // Account-scoped: load ALL guilds owned by this Discord user.
  const rows = await query<GuildRow>(
    `SELECT guild_id, guild_name, tier, custom_domain, domain_status, is_hosted,
            stripe_subscription_id, stripe_status, expires_at, bot_port,
            dashboard_host, dashboard_domain, dashboard_domain_status,
            access_checked_at, access_lost_at
       FROM ticketbot_guilds
      WHERE discord_user_id = ?
      ORDER BY created_at ASC`,
    [session.discordUserId],
  );

  if (rows.length === 0) {
    redirect(publicPath(lang, '/dashboard/ticket-bot/verify'));
  }

  // Owning a row in our database is not the same as administering the Discord
  // server it describes, and until 2026-09-12 this page treated it as if it
  // were. Anything older than ACCESS_STALE_HOURS gets one silent trip through
  // Discord (prompt=none, no consent screen) to find out.
  //
  // Every row predating the two columns has access_checked_at = NULL and is
  // therefore stale, so the first dashboard load after the deploy re-checks
  // once per person. That is the point: nobody should be judged on a check
  // that never happened.
  //
  // The guard cookie is what keeps this from becoming a redirect loop. It is
  // written by the OAuth start route, because a server component cannot set
  // cookies, and it is written BEFORE the redirect - so an attempt that never
  // returns still counts as spent.
  const recheckSpent = cookieStore.get(RECHECK_COOKIE)?.value === '1';
  if (!recheckSpent && rows.some(r => isAccessStale(r))) {
    redirect('/api/auth/discord-verify?recheck=1');
  }

  const guilds: DashboardGuild[] = rows
    .map(({ access_checked_at, access_lost_at, ...guild }) => ({
      ...guild,
      access_state:         accessState({ access_checked_at, access_lost_at }),
      access_grace_ends_at: accessGraceEndsAt({ access_checked_at, access_lost_at }),
    }))
    // A revoked guild disappears rather than showing read-only: the whole
    // point is that a removed admin stops seeing the server's transcripts and
    // tier. The explanation lives on the verify page, which is where they land
    // when nothing is left.
    .filter(g => g.access_state !== 'revoked');

  if (guilds.length === 0) {
    redirect(publicPath(lang, '/dashboard/ticket-bot/verify?error=access_revoked'));
  }

  return { lang, guilds };
});

/**
 * The server an address names, if the signed-in person may manage it.
 *
 * The `[server]` segment is untrusted input. It is never queried: it is only
 * looked up in the list above, which the session alone decided. A server of
 * somebody else, a revoked one, one that does not exist and a malformed id
 * all give the same `null`, so the answer says nothing about whether such a
 * server exists. The API routes behind every action check ownership again
 * through `authorizeGuild()` (lib/dashboardAuth.ts).
 */
export async function loadTicketBotServer(server: string): Promise<{
  lang:   Lang;
  guilds: DashboardGuild[];
  guild:  DashboardGuild | null;
}> {
  const { lang, guilds } = await loadTicketBotGuilds();
  const guild = guilds.find(g => g.guild_id === server) ?? null;
  return { lang, guilds, guild };
}
