import { cookies }              from 'next/headers';
import { redirect }             from 'next/navigation';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { queryOne }              from '@/lib/db';
import DashboardClient          from './DashboardClient';
import type { Tier }            from '@/lib/tiers';

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
    redirect('/verify');
  }

  const guild = await queryOne<GuildRow>(
    `SELECT guild_id, tier, custom_domain, domain_status, github_username, is_hosted
     FROM ticketbot_guilds WHERE guild_id = ?`,
    [session.guildId],
  );

  if (!guild) {
    redirect('/verify');
  }

  const serverIp = process.env.SERVER_PUBLIC_IP ?? '';

  return (
    <DashboardClient
      guild={guild}
      serverIp={serverIp}
    />
  );
}
