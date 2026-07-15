import { cookies, headers }      from 'next/headers';
import { redirect }              from 'next/navigation';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { query }                 from '@/lib/db';
import DashboardClient           from './DashboardClient';
import type { Tier }             from '@/lib/tiers';

// Session-/Cookie-abhängig + server-seitiger redirect() → niemals statisch/route-cachen.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard – MSK Scripts',
}

export interface DashboardGuild {
  guild_id:               string;
  guild_name:             string | null;
  tier:                   Tier;
  custom_domain:          string | null;
  domain_status:          'none' | 'pending_dns' | 'active';
  is_hosted:              number;
  stripe_subscription_id: string | null;
  bot_port:               number | null;
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
    `SELECT guild_id, guild_name, tier, custom_domain, domain_status, is_hosted, stripe_subscription_id, bot_port
       FROM ticketbot_guilds
      WHERE discord_user_id = ?
      ORDER BY created_at ASC`,
    [session.discordUserId],
  );

  if (guilds.length === 0) {
    redirect('/ticketbot/verify');
  }

  const serverIp = process.env.SERVER_PUBLIC_IP ?? '';

  // CSP nonce (set per request in middleware.ts) — passed down so the CodeMirror
  // editor can nonce its runtime-injected <style> elements; otherwise the strict
  // `style-src 'self' 'nonce-…'` blocks them and the editor renders blank.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <DashboardClient
      guilds={guilds}
      serverIp={serverIp}
      nonce={nonce}
    />
  );
}
