import { cookies }               from 'next/headers';
import { redirect }              from 'next/navigation';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { query }                 from '@/lib/db';
import DashboardClient           from './DashboardClient';
import type { Tier }             from '@/lib/tiers';

// Session-/Cookie-abhängig + server-seitiger redirect() → niemals statisch/route-cachen.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

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
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;

  if (!session?.discordUserId) {
    redirect('/ticketbot/verify');
  }

  // Account-scoped: load ALL guilds owned by this Discord user.
  const guilds = await query<DashboardGuild>(
    `SELECT guild_id, guild_name, tier, custom_domain, domain_status, is_hosted,
            stripe_subscription_id, stripe_status, expires_at, bot_port,
            dashboard_host, dashboard_domain, dashboard_domain_status
       FROM ticketbot_guilds
      WHERE discord_user_id = ?
      ORDER BY created_at ASC`,
    [session.discordUserId],
  );

  if (guilds.length === 0) {
    redirect('/ticketbot/verify');
  }

  const serverIp = process.env.SERVER_PUBLIC_IP ?? '';

  return (
    <DashboardClient
      guilds={guilds}
      serverIp={serverIp}
    />
  );
}
