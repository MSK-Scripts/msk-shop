import { NextRequest, NextResponse } from 'next/server'
import { spawn }                     from 'child_process'
import { join }                      from 'path'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { query, queryOne }           from '@/lib/db'
import { TIER_CONFIG }               from '@/lib/tiers'
import { rateLimit, getClientIp }    from '@/lib/rateLimit'
import { siteUrl }                   from '@/lib/siteUrl'
import { ionosApiKey }               from '@/lib/ionosDns'
import { proxySecret }               from '@/lib/botDashboardProxy'
import {
  generateDashboardHost, publishDashboardHost, unpublishDashboardHost, DashboardHostError,
} from '@/lib/dashboardHost'
import {
  allocateBotPort, buildBotEnv, claimHostingJob, discardArchives, discardStagedEnv,
  failHostingJob, findArchives, restoreArchive, stageBotEnv, validateHostingForm,
  type HostingForm,
} from '@/lib/botProvision'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/bot-hosting/provision — set up hosting for this guild.
 *
 * Does the fast, reversible half inline and hands the slow half to a detached
 * worker (scripts/bot-provision.js). The customer therefore learns about a bad
 * form, an exhausted port range or a DNS failure immediately, and only waits for
 * the parts that genuinely take minutes.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const guild = auth.guild
  if (!guild.active)                       return NextResponse.json({ error: 'inactive' },   { status: 403 })
  if (!TIER_CONFIG[guild.tier].botHosting) return NextResponse.json({ error: 'tier' },       { status: 403 })
  if (guild.is_hosted)                     return NextResponse.json({ error: 'already' },    { status: 409 })
  if (!ionosApiKey())                      return NextResponse.json({ error: 'unconfigured' }, { status: 503 })

  // Each attempt clones a repository and runs npm install. Bounded tightly:
  // a legitimate retry after a bad token goes through /env, not through here.
  if (!rateLimit(`hosting-provision:${guild.guild_id}`, { limit: 5, windowMs: 60 * 60_000 }) ||
      !rateLimit(`hosting-provision-ip:${getClientIp(req)}`, { limit: 10, windowMs: 60 * 60_000 })) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let form: Partial<HostingForm>
  let archiveChoice: 'restore' | 'discard' | null = null
  try {
    const body = await req.json()
    const choice = String((body as { archive?: unknown })?.archive ?? '')
    archiveChoice = choice === 'restore' || choice === 'discard' ? choice : null
    form = {
      token:        String(body?.token ?? '').trim(),
      clientId:     String(body?.clientId ?? '').trim(),
      clientSecret: String(body?.clientSecret ?? '').trim(),
      databaseUrl:  String(body?.databaseUrl ?? '').trim(),
      publicPortal: Boolean(body?.publicPortal),
    }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const invalid = validateHostingForm(form)
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })

  // An archived installation still holds the ticket history, and only the
  // customer can say whether this is a comeback or a fresh start. Guessing
  // either way is destructive: restoring silently resurrects data they may have
  // wanted gone, discarding silently destroys the history they came back for.
  const archives = await findArchives(guild.guild_id).catch(() => [])
  if (archives.length > 0 && !archiveChoice) {
    return NextResponse.json({ error: 'archive_choice_required', archives }, { status: 409 })
  }

  // Claimed before anything is created, so two clicks cannot start two runs that
  // clone into the same directory and fight over the same PM2 name.
  if (!(await claimHostingJob(guild.guild_id))) {
    return NextResponse.json({ error: 'in_progress' }, { status: 409 })
  }

  const row = await queryOne<{ api_key: string }>(
    'SELECT api_key FROM ticketbot_guilds WHERE guild_id = ?', [guild.guild_id])
  if (!row?.api_key) {
    await failHostingJob(guild.guild_id, 'no_api_key')
    return NextResponse.json({ error: 'no_api_key' }, { status: 500 })
  }

  const host = guild.dashboard_host || generateDashboardHost()
  let port: number

  try {
    if (archives.length > 0) {
      if (archiveChoice === 'restore') await restoreArchive(guild.guild_id, archives[0].name)
      else                             await discardArchives(guild.guild_id)
    }
    port = await allocateBotPort()
    await publishDashboardHost(host, port)
    await query(
      'UPDATE ticketbot_guilds SET bot_port = ?, dashboard_host = ? WHERE guild_id = ?',
      [port, host, guild.guild_id],
    )
    await stageBotEnv(guild.guild_id, buildBotEnv(form as HostingForm, {
      guildId:     guild.guild_id,
      apiKey:      row.api_key,
      port,
      host,
      proxySecret: proxySecret(),
      baseUrl:     siteUrl(),
    }))
  } catch (err) {
    console.error('[hosting/provision] setup failed:', err)
    // Undo what we did create. Leaving a vhost and DNS records behind for a run
    // that never started would hand the next allocation a port that looks taken.
    await unpublishDashboardHost(host)
    await query(
      'UPDATE ticketbot_guilds SET bot_port = NULL, dashboard_host = NULL WHERE guild_id = ?',
      [guild.guild_id],
    )
    await discardStagedEnv(guild.guild_id)
    const message = err instanceof DashboardHostError ? err.message : 'setup_failed'
    await failHostingJob(guild.guild_id, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Detached, with its own session: the installation must survive a deploy
  // restarting this process. stdio is discarded because the worker records its
  // own progress in the database — nobody would ever read a pipe we kept open.
  const child = spawn(process.execPath, [join(process.cwd(), 'scripts', 'bot-provision.js'), guild.guild_id], {
    detached: true,
    stdio:    'ignore',
    env:      process.env,
  })
  child.unref()

  return NextResponse.json({ ok: true, host, port }, { status: 202 })
}
