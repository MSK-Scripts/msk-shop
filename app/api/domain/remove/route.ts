import { NextResponse }          from 'next/server';
import { cookies }               from 'next/headers';
import { execFile }              from 'child_process';
import { promisify }             from 'util';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { query, queryOne }       from '@/lib/db';

const execFileAsync = promisify(execFile);

interface GuildRow {
  custom_domain: string | null;
  domain_status: string;
}

export async function POST(): Promise<NextResponse> {
  // Auth
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;
  if (!session?.guildId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const guild = await queryOne<GuildRow>(
    `SELECT custom_domain, domain_status FROM ticketbot_guilds WHERE guild_id = ?`,
    [session.guildId],
  );

  if (!guild?.custom_domain) {
    return NextResponse.json({ error: 'No domain configured.' }, { status: 400 });
  }

  // Remove VHost if active
  if (guild.domain_status === 'active') {
    try {
      await execFileAsync('sudo', ['/opt/msk-shop/scripts/vhost-delete.sh', guild.custom_domain]);
    } catch (err) {
      console.error('[domain/remove] VHost deletion failed:', err);
      // Continue anyway — update DB regardless
    }
  }

  await query(
    `UPDATE ticketbot_guilds SET custom_domain = NULL, domain_status = 'none' WHERE guild_id = ?`,
    [session.guildId],
  );

  return NextResponse.json({ success: true });
}
