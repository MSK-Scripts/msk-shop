import { cookies, headers }     from 'next/headers';
import { redirect }             from 'next/navigation';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { queryOne }              from '@/lib/db';
import DashboardClient          from './DashboardClient';
import type { Tier }            from '@/lib/tiers';

// Session-/Cookie-abhängig + server-seitiger redirect() → niemals statisch/route-cachen.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard – MSK Scripts',
}

interface GuildRow {
  guild_id:        string;
  tier:            Tier;
  custom_domain:   string | null;
  domain_status:   'none' | 'pending_dns' | 'active';
  github_username: string | null;
  is_hosted:       number;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;

  if (!session?.guildId) {
    redirect('/ticketbot/verify');
  }

  const guild = await queryOne<GuildRow>(
    `SELECT guild_id, tier, custom_domain, domain_status, github_username, is_hosted
     FROM ticketbot_guilds WHERE guild_id = ?`,
    [session.guildId],
  );

  if (!guild) {
    redirect('/ticketbot/verify');
  }

  const serverIp = process.env.SERVER_PUBLIC_IP ?? '';

  // CSP nonce (set per request in middleware.ts) — passed down so the CodeMirror
  // editor can nonce its runtime-injected <style> elements; otherwise the strict
  // `style-src 'self' 'nonce-…'` blocks them and the editor renders blank.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <DashboardClient
      guild={guild}
      serverIp={serverIp}
      nonce={nonce}
    />
  );
}
