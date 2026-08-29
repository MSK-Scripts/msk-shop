import { NextRequest, NextResponse } from 'next/server'
import { exec }                      from 'child_process'
import { promises as dns }           from 'dns'
import { promisify }                 from 'util'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { query, queryOne }           from '@/lib/db'
import { TIER_CONFIG }               from '@/lib/tiers'
import { rateLimit, getClientIp }    from '@/lib/rateLimit'
import { patchBotEnv }               from '@/lib/botEnv'
import { isInOwnZone }               from '@/lib/ionosDns'
import {
  publishDashboardHost, unpublishDashboardHost, DashboardHostError,
  dashboardUrl, dashboardRedirectUri,
} from '@/lib/dashboardHost'
import type { DashboardGuild } from '@/lib/dashboardAuth'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// =============================================================================
// The customer's OWN domain in front of their hosted bot's dashboard
// =============================================================================
// Same idea as the transcripts custom domain, but a different vhost: this one
// proxies to the bot's loopback port instead of serving files, and it needs its
// own certificate because it is outside our zone and the wildcard cannot cover
// it. Hence MODE=certbot in bot-vhost-create.sh.
//
// The generated tickets-….msk-scripts.de host stays up alongside it. Taking it
// down would strand anyone who bookmarked it, and it costs nothing to keep.
// =============================================================================

// No protocol, no path, no port.
const DOMAIN_RE = /^[a-zA-Z0-9][a-zA-Z0-9.-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/

async function pointsHere(domain: string): Promise<boolean> {
  const expected = process.env.SERVER_PUBLIC_IP ?? ''
  if (!expected) return false
  try {
    return (await dns.resolve4(domain)).includes(expected)
  } catch {
    return false
  }
}

/**
 * Bring the domain online: certificate, vhost, and the bot's own idea of where
 * it lives.
 *
 * The .env update is not an afterthought. `DASHBOARD_PUBLIC_URL` is what the bot
 * builds its OAuth redirect URI from, so a vhost without it would serve a
 * dashboard whose login bounces to the old address — working page, broken
 * sign-in, and nothing in any log to say why.
 */
async function activate(guild: DashboardGuild, domain: string) {
  await publishDashboardHost(domain, guild.bot_port!, { certbot: true })

  await patchBotEnv(guild.guild_id, { DASHBOARD_PUBLIC_URL: dashboardUrl(domain) })
  await execAsync(`pm2 restart ticketbot-${guild.guild_id}`, { timeout: 20_000 })
    .catch(e => console.warn('[hosting/domain] pm2 restart failed:', e))

  await query(
    `UPDATE ticketbot_guilds SET dashboard_domain = ?, dashboard_domain_status = 'active' WHERE guild_id = ?`,
    [domain, guild.guild_id],
  )
}

/** Shared gate for all three verbs. */
async function gate(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) }

  const guild = auth.guild
  if (!guild.active)                        return { error: NextResponse.json({ error: 'inactive' },   { status: 403 }) }
  if (!TIER_CONFIG[guild.tier].customDomain) return { error: NextResponse.json({ error: 'tier' },      { status: 403 }) }
  if (!guild.is_hosted || !guild.bot_port)  return { error: NextResponse.json({ error: 'not_hosted' }, { status: 409 }) }
  return { guild }
}

/** Certificate issuance and Apache reloads are shared infrastructure; a DNS
 *  lookup is not. Only the expensive branch is bounded, so a customer can click
 *  "check DNS" as often as they like while waiting for propagation — the same
 *  mistake that once locked a Premium customer out of their own domain setup. */
function provisionAllowed(req: NextRequest, guildId: string): boolean {
  return rateLimit(`dash-domain:${guildId}`, { limit: 6, windowMs: 15 * 60_000 })
      && rateLimit(`dash-domain-ip:${getClientIp(req)}`, { limit: 12, windowMs: 15 * 60_000 })
}

// ── POST: save a domain and, if DNS already points here, activate it ─────────

export async function POST(req: NextRequest) {
  const g = await gate(req)
  if ('error' in g) return g.error
  const guild = g.guild

  let domain: string
  try {
    domain = String(((await req.json()) as { domain?: unknown })?.domain ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!DOMAIN_RE.test(domain)) return NextResponse.json({ error: 'invalid_domain' }, { status: 400 })

  // Nobody gets to claim a name inside our own zone. Without this a customer
  // could enter `www.msk-scripts.de`, and since certbot would be asked for a
  // certificate we cannot get and Apache for a vhost that shadows the real one,
  // the failure would land on the main site rather than on them.
  if (isInOwnZone(domain)) {
    return NextResponse.json({ error: 'reserved_domain' }, { status: 400 })
  }

  // A domain can only ever point at one vhost, so a name already used for
  // transcripts or for another guild's dashboard is not available here either.
  const taken = await queryOne<{ guild_id: string }>(
    `SELECT guild_id FROM ticketbot_guilds
      WHERE (custom_domain = ? OR (dashboard_domain = ? AND guild_id <> ?))
      LIMIT 1`,
    [domain, domain, guild.guild_id],
  )
  if (taken) return NextResponse.json({ error: 'domain_taken' }, { status: 409 })

  // Replacing a different, already active domain: take the old one down first,
  // otherwise its vhost keeps answering and its certificate keeps renewing for a
  // name we no longer serve.
  if (guild.dashboard_domain && guild.dashboard_domain !== domain && guild.dashboard_domain_status === 'active') {
    await unpublishDashboardHost(guild.dashboard_domain)
  }

  if (!(await pointsHere(domain))) {
    await query(
      `UPDATE ticketbot_guilds SET dashboard_domain = ?, dashboard_domain_status = 'pending_dns' WHERE guild_id = ?`,
      [domain, guild.guild_id],
    )
    return NextResponse.json({
      status: 'pending_dns', domain, serverIp: process.env.SERVER_PUBLIC_IP ?? null,
    })
  }

  if (!provisionAllowed(req, guild.guild_id)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    await activate({ ...guild, dashboard_domain: domain }, domain)
  } catch (err) {
    console.error('[hosting/domain] activation failed:', err)
    await query(
      `UPDATE ticketbot_guilds SET dashboard_domain = ?, dashboard_domain_status = 'pending_dns' WHERE guild_id = ?`,
      [domain, guild.guild_id],
    )
    return NextResponse.json(
      { error: err instanceof DashboardHostError && err.kind === 'ssl' ? 'ssl_failed' : 'setup_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: 'active', domain,
    url: dashboardUrl(domain), redirectUri: dashboardRedirectUri(domain),
  })
}

// ── PATCH: the customer set the DNS record and wants us to look again ────────

export async function PATCH(req: NextRequest) {
  const g = await gate(req)
  if ('error' in g) return g.error
  const guild = g.guild

  const domain = guild.dashboard_domain
  if (!domain) return NextResponse.json({ error: 'no_domain' }, { status: 400 })

  if (!(await pointsHere(domain))) {
    return NextResponse.json({
      status: 'pending_dns', domain, serverIp: process.env.SERVER_PUBLIC_IP ?? null,
    })
  }

  if (!provisionAllowed(req, guild.guild_id)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    await activate(guild, domain)
  } catch (err) {
    console.error('[hosting/domain] activation failed:', err)
    return NextResponse.json(
      { error: err instanceof DashboardHostError && err.kind === 'ssl' ? 'ssl_failed' : 'setup_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: 'active', domain,
    url: dashboardUrl(domain), redirectUri: dashboardRedirectUri(domain),
  })
}

// ── DELETE: back to the generated subdomain ──────────────────────────────────

export async function DELETE(req: NextRequest) {
  const g = await gate(req)
  if ('error' in g) return g.error
  const guild = g.guild

  if (guild.dashboard_domain) await unpublishDashboardHost(guild.dashboard_domain)

  // Point the bot back at the host we own. Skipping this would leave
  // DASHBOARD_PUBLIC_URL on a domain that no longer resolves to us, and the
  // dashboard would still be reachable while its login was not.
  if (guild.dashboard_host) {
    await patchBotEnv(guild.guild_id, { DASHBOARD_PUBLIC_URL: dashboardUrl(guild.dashboard_host) })
      .catch(e => console.error('[hosting/domain] .env revert failed:', e))
    await execAsync(`pm2 restart ticketbot-${guild.guild_id}`, { timeout: 20_000 })
      .catch(e => console.warn('[hosting/domain] pm2 restart failed:', e))
  }

  await query(
    `UPDATE ticketbot_guilds SET dashboard_domain = NULL, dashboard_domain_status = 'none' WHERE guild_id = ?`,
    [guild.guild_id],
  )

  return NextResponse.json({
    status: 'none',
    url:         guild.dashboard_host ? dashboardUrl(guild.dashboard_host) : null,
    redirectUri: guild.dashboard_host ? dashboardRedirectUri(guild.dashboard_host) : null,
  })
}
