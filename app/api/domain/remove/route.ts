import { NextResponse }          from 'next/server';
import { execFile }              from 'child_process';
import { promisify }             from 'util';
import { authorizeGuild }        from '@/lib/dashboardAuth';
import { query }                 from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const execFileAsync = promisify(execFile);

export async function POST(req: Request): Promise<NextResponse> {
  // Parse body
  let guildId: string;
  try {
    const body = await req.json();
    guildId    = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Auth — the session's Discord user must own this guild
  const auth = await authorizeGuild(guildId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const guild = auth.guild;

  // Rate limit — shells out to vhost-delete.sh (apache reload). Short window so a
  // legitimate retry is never locked out for long.
  if (!rateLimit(`domain-remove:${guildId}`, { limit: 8, windowMs: 15 * 60_000 }) ||
      !rateLimit(`domain-remove-ip:${getClientIp(req)}`, { limit: 16, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: 'Too many domain changes. Try again a few minutes later.' }, { status: 429 });
  }

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
    [guildId],
  );

  return NextResponse.json({ success: true });
}
