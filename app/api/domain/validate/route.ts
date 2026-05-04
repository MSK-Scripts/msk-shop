import { NextResponse }          from 'next/server';
import { cookies }               from 'next/headers';
import { promises as dns }       from 'dns';
import { execFile }              from 'child_process';
import { promisify }             from 'util';
import { parseDashboardSession } from '@/lib/dashboardSession';
import { query, queryOne }       from '@/lib/db';

const execFileAsync = promisify(execFile);

interface GuildRow {
  guild_id:      string;
  custom_domain: string | null;
  domain_status: string;
}

async function checkDns(domain: string): Promise<boolean> {
  const expected = process.env.SERVER_PUBLIC_IP ?? '';
  if (!expected) return false;
  try {
    const addresses = await dns.resolve4(domain);
    return addresses.includes(expected);
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  // Auth
  const cookieStore = await cookies();
  const token       = cookieStore.get('msk_dashboard_session')?.value;
  const session     = token ? parseDashboardSession(token) : null;
  if (!session?.guildId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const guild = await queryOne<GuildRow>(
    `SELECT guild_id, custom_domain, domain_status FROM ticketbot_guilds WHERE guild_id = ?`,
    [session.guildId],
  );

  if (!guild?.custom_domain) {
    return NextResponse.json({ error: 'No domain configured.' }, { status: 400 });
  }

  // Re-check DNS
  const dnsOk = await checkDns(guild.custom_domain);

  if (!dnsOk) {
    return NextResponse.json({
      success:  false,
      status:   'pending_dns',
      domain:   guild.custom_domain,
      serverIp: process.env.SERVER_PUBLIC_IP,
      message:  'DNS is still not pointing to this server.',
    });
  }

  // DNS is now OK and status was pending — create VHost
  if (guild.domain_status !== 'active') {
    try {
      await execFileAsync('sudo', [
        '/opt/msk-scripts/vhost-create.sh',
        guild.custom_domain,
        session.guildId,
        process.env.ADMIN_EMAIL ?? 'info@msk-scripts.de',
      ]);
    } catch (err) {
      console.error('[domain/validate] VHost creation failed:', err);
      return NextResponse.json({ error: 'Failed to configure domain on the server.' }, { status: 500 });
    }

    await query(
      `UPDATE ticketbot_guilds SET domain_status = 'active' WHERE guild_id = ?`,
      [session.guildId],
    );
  }

  return NextResponse.json({ success: true, status: 'active', domain: guild.custom_domain });
}
