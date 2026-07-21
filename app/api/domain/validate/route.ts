import { NextResponse }          from 'next/server';
import { promises as dns }       from 'dns';
import { execFile }              from 'child_process';
import { promisify }             from 'util';
import { authorizeGuild }        from '@/lib/dashboardAuth';
import { query }                 from '@/lib/db';
import { TIER_CONFIG }           from '@/lib/tiers';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const execFileAsync = promisify(execFile);

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

  // Tier gate — custom domains are Premium/Premium+ only. This MUST be enforced
  // here too (not just in /api/domain/set): a guild that saved a domain while
  // premium keeps its custom_domain row after a downgrade, and without this gate
  // could re-provision the vhost + SSL for free by calling validate directly.
  if (!TIER_CONFIG[guild.tier].customDomain) {
    return NextResponse.json({ error: 'Custom domains require Premium or Premium+.' }, { status: 403 });
  }

  // Rate limit — validate provisions a vhost + Let's Encrypt cert (shared ACME
  // quota), so cap it per guild and per IP.
  if (!rateLimit(`domain-validate:${guildId}`, { limit: 5, windowMs: 3600_000 }) ||
      !rateLimit(`domain-validate-ip:${getClientIp(req)}`, { limit: 10, windowMs: 3600_000 })) {
    return NextResponse.json({ error: 'Too many domain checks. Try again later.' }, { status: 429 });
  }

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
        '/opt/msk-shop/scripts/vhost-create.sh',
        guild.custom_domain,
        guildId,
        process.env.ADMIN_EMAIL ?? 'info@msk-scripts.de',
      ]);
    } catch (err) {
      console.error('[domain/validate] VHost creation failed:', err);
      return NextResponse.json({ error: 'Failed to configure domain on the server.' }, { status: 500 });
    }

    await query(
      `UPDATE ticketbot_guilds SET domain_status = 'active' WHERE guild_id = ?`,
      [guildId],
    );
  }

  return NextResponse.json({ success: true, status: 'active', domain: guild.custom_domain });
}
