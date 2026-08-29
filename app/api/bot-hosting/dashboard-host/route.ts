import { NextRequest, NextResponse } from 'next/server'
import { exec }                      from 'child_process'
import { promisify }                 from 'util'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { query }                     from '@/lib/db'
import { rateLimit, getClientIp }    from '@/lib/rateLimit'
import { patchBotEnv }               from '@/lib/botEnv'
import { ionosApiKey }               from '@/lib/ionosDns'
import {
  generateDashboardHost, publishDashboardHost, DashboardHostError,
  dashboardUrl, dashboardRedirectUri,
} from '@/lib/dashboardHost'

const execAsync = promisify(exec)

// Node runtime: shells out to sudo/pm2 and writes the bot's .env.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/bot-hosting/dashboard-host — give this hosted bot its own public
 * host, or repair the one it already has.
 *
 * Idempotent by design. An existing dashboard_host is re-published rather than
 * replaced: the customer has registered `https://<host>/auth/callback` in the
 * Discord developer portal by hand, and minting a fresh name would silently
 * invalidate that. So a retry after a half-finished run (records written, vhost
 * not) converges on the SAME name.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const guild = auth.guild
  if (!guild.is_hosted || !guild.active) {
    return NextResponse.json({ error: 'Not available for this account' }, { status: 403 })
  }
  if (!guild.bot_port) {
    return NextResponse.json({ error: 'This bot has no dashboard port assigned yet.' }, { status: 409 })
  }
  if (!ionosApiKey()) {
    return NextResponse.json({ error: 'Subdomain automation is not configured.' }, { status: 503 })
  }

  // Writes DNS records and reloads Apache — cheap per call but shared
  // infrastructure, so bound per guild and per IP.
  if (!rateLimit(`dashboard-host:${guild.guild_id}`, { limit: 6, windowMs: 15 * 60_000 }) ||
      !rateLimit(`dashboard-host-ip:${getClientIp(req)}`, { limit: 12, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })
  }

  const host = guild.dashboard_host || generateDashboardHost()

  try {
    await publishDashboardHost(host, guild.bot_port)
  } catch (err) {
    console.error('[dashboard-host] publish failed:', err)
    const message = err instanceof DashboardHostError
      ? err.message
      : 'Could not set up the subdomain. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  await query('UPDATE ticketbot_guilds SET dashboard_host = ? WHERE guild_id = ?', [host, guild.guild_id])

  // Point the bot at its own public address. Without this its OAuth redirect
  // still names the loopback URL and the Discord login fails with an error page
  // that says nothing about us.
  let envError: string | null = null
  try {
    const changed = await patchBotEnv(guild.guild_id, {
      DASHBOARD_ENABLED:    'true',
      DASHBOARD_PUBLIC_URL: dashboardUrl(host),
    })
    // Only bounce the process when something actually changed — a repair run on
    // an already-correct .env should not interrupt open tickets.
    if (changed.length > 0) {
      await execAsync(`pm2 restart ticketbot-${guild.guild_id}`, { timeout: 20_000 })
        .catch(e => console.warn('[dashboard-host] pm2 restart failed:', e))
    }
  } catch (err) {
    // The host itself is live; the .env is a separate failure worth naming
    // rather than rolling the whole thing back.
    console.error('[dashboard-host] .env update failed:', err)
    envError = 'The subdomain is live, but the bot configuration could not be updated automatically.'
  }

  return NextResponse.json({
    host,
    url:         dashboardUrl(host),
    redirectUri: dashboardRedirectUri(host),
    warning:     envError,
  })
}
