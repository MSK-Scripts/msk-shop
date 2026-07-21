import { NextResponse }              from 'next/server';
import { execFile }                  from 'child_process';
import { promisify }                 from 'util';
import { promises as dns }           from 'dns';
import { authorizeGuild }            from '@/lib/dashboardAuth';
import { query, queryOne }           from '@/lib/db';
import { TIER_CONFIG }               from '@/lib/tiers';
import { rateLimit, getClientIp }    from '@/lib/rateLimit';

const execFileAsync = promisify(execFile);

// Domain format: e.g. tickets.example.com — no protocol, no path, no port
const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;

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
  let domain: string;
  let guildId: string;
  try {
    const body = await req.json();
    domain     = String(body.domain ?? '').trim().toLowerCase();
    guildId    = String(body.guildId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Auth — the session's Discord user must own this guild
  const auth = await authorizeGuild(guildId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const guild = auth.guild;

  // Validate format
  if (!DOMAIN_REGEX.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format. Use e.g. tickets.example.com' }, { status: 400 });
  }

  if (!guild.active) {
    return NextResponse.json({ error: 'Guild not found.' }, { status: 404 });
  }
  if (!TIER_CONFIG[guild.tier].customDomain) {
    return NextResponse.json({ error: 'Custom domains require Premium or Premium+.' }, { status: 403 });
  }

  // Check domain not already taken by another guild
  const existing = await queryOne<{ guild_id: string }>(
    `SELECT guild_id FROM ticketbot_guilds WHERE custom_domain = ? AND guild_id != ?`,
    [domain, guildId],
  );
  if (existing) {
    return NextResponse.json({ error: 'This domain is already registered to another server.' }, { status: 409 });
  }

  // If domain changed and there was an old active domain → remove old VHost
  if (guild.custom_domain && guild.custom_domain !== domain && guild.domain_status === 'active') {
    try {
      await execFileAsync('sudo', ['/opt/msk-shop/scripts/vhost-delete.sh', guild.custom_domain]);
    } catch (err) {
      console.error('[domain/set] Failed to delete old VHost:', err);
    }
  }

  // Validate DNS
  const dnsOk = await checkDns(domain);

  if (!dnsOk) {
    // Save domain as pending_dns — user needs to set DNS first
    await query(
      `UPDATE ticketbot_guilds SET custom_domain = ?, domain_status = 'pending_dns' WHERE guild_id = ?`,
      [domain, guildId],
    );
    return NextResponse.json({
      success:      false,
      status:       'pending_dns',
      domain,
      serverIp:     process.env.SERVER_PUBLIC_IP,
      message:      'Domain saved. DNS is not yet pointing to this server. Set the A-record and click "Check DNS" again.',
    });
  }

  // DNS is OK → create VHost + SSL. Rate limit ONLY this provisioning step — it
  // runs certbot against the shared Let's Encrypt ACME quota. Shared bucket with
  // /api/domain/validate so total cert-issuing attempts per guild are bounded,
  // while saving a domain as pending_dns (above) stays unlimited. Lenient + short
  // window so a legitimate retry is never locked out for long.
  if (!rateLimit(`domain-provision:${guildId}`, { limit: 6, windowMs: 15 * 60_000 }) ||
      !rateLimit(`domain-provision-ip:${getClientIp(req)}`, { limit: 12, windowMs: 15 * 60_000 })) {
    return NextResponse.json(
      { error: 'Too many domain activations. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  try {
    await execFileAsync('sudo', [
      '/opt/msk-shop/scripts/vhost-create.sh',
      domain,
      guildId,
      process.env.ADMIN_EMAIL ?? 'info@msk-scripts.de',
    ]);
  } catch (err) {
    console.error('[domain/set] VHost creation failed:', err);
    return NextResponse.json({ error: 'Failed to configure domain on the server. Please try again.' }, { status: 500 });
  }

  await query(
    `UPDATE ticketbot_guilds SET custom_domain = ?, domain_status = 'active' WHERE guild_id = ?`,
    [domain, guildId],
  );

  return NextResponse.json({ success: true, status: 'active', domain });
}
