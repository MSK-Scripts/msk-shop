import { NextRequest, NextResponse } from 'next/server'
import { spawn }                     from 'child_process'
import { join }                      from 'path'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { TIER_CONFIG }               from '@/lib/tiers'
import { rateLimit, getClientIp }    from '@/lib/rateLimit'
import { patchBotEnv, readBotEnv, parseEnv } from '@/lib/botEnv'
import { claimHostingJob, failHostingJob } from '@/lib/botProvision'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/bot-hosting/env — what is currently configured, secrets masked.
 *
 * The token and the client secret are NEVER sent back. The form shows them as
 * "set, leave empty to keep" and an untouched field is simply not patched, so a
 * customer correcting their client id cannot accidentally blank their token by
 * submitting a form they did not fully retype.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  // "Nothing installed yet" is an answer, not a failure: the setup form asks for
  // this before it has anything to show, and a 404 there would paint an error
  // banner over a page where nothing is wrong.
  let env: Record<string, string> | null = null
  if (auth.guild.is_hosted) {
    try {
      env = parseEnv(await readBotEnv(auth.guild.guild_id))
    } catch {
      env = null
    }
  }

  return NextResponse.json({
    env: env && {
      clientId:        env.CLIENT_ID ?? '',
      databaseUrl:     env.DATABASE_URL ?? '',
      publicPortal:    env.DASHBOARD_PUBLIC_PORTAL === 'true',
      tokenSet:        !!env.TOKEN,
      clientSecretSet: !!env.CLIENT_SECRET,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * POST /api/bot-hosting/env — correct the configuration and restart.
 *
 * This is the retry path: the bot is installed but did not come up, almost
 * always because a value is wrong. Only the fields the customer actually filled
 * in are written, and the restart plus health check runs through the SAME
 * detached worker as the initial setup (in --restart-only mode), so the
 * dashboard polls one status endpoint and failures look the same either way.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const guild = auth.guild
  if (!TIER_CONFIG[guild.tier].botHosting) return NextResponse.json({ error: 'tier' }, { status: 403 })
  if (!guild.is_hosted && !guild.bot_port) return NextResponse.json({ error: 'not_hosted' }, { status: 409 })

  if (!rateLimit(`hosting-env:${guild.guild_id}`, { limit: 20, windowMs: 15 * 60_000 }) ||
      !rateLimit(`hosting-env-ip:${getClientIp(req)}`, { limit: 40, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // An empty string means "keep what is there", which is what the masked secret
  // fields submit when the customer does not retype them.
  const str = (v: unknown) => {
    const s = String(v ?? '').trim()
    return s === '' ? undefined : s
  }

  const token        = str(body.token)
  const clientId     = str(body.clientId)
  const clientSecret = str(body.clientSecret)
  const publicPortal = typeof body.publicPortal === 'boolean' ? body.publicPortal : undefined
  // databaseUrl is different: an empty value is a meaningful choice (fall back
  // to the bundled SQLite file), so it is only left alone when absent entirely.
  const databaseUrl  = 'databaseUrl' in body ? String(body.databaseUrl ?? '').trim() : undefined

  // Validated field by field rather than through validateHostingForm(), which
  // requires all three values: here most of them are deliberately absent because
  // they are already on disk and were valid when they were written.
  for (const [key, check] of [
    ['token',        () => !token        || token.length >= 20],
    ['clientId',     () => !clientId     || /^\d{17,20}$/.test(clientId)],
    ['clientSecret', () => !clientSecret || clientSecret.length >= 16],
    ['databaseUrl',  () => !databaseUrl  || /^(mysql|postgres|sqlite):/i.test(databaseUrl)],
  ] as Array<[string, () => boolean]>) {
    if (!check()) return NextResponse.json({ error: `invalid_${key}` }, { status: 400 })
  }

  if (!(await claimHostingJob(guild.guild_id))) {
    return NextResponse.json({ error: 'in_progress' }, { status: 409 })
  }

  try {
    await patchBotEnv(guild.guild_id, {
      TOKEN:                   token,
      CLIENT_ID:               clientId,
      CLIENT_SECRET:           clientSecret,
      DATABASE_URL:            databaseUrl,
      DASHBOARD_PUBLIC_PORTAL: publicPortal === undefined ? undefined : String(publicPortal),
    })
  } catch (err) {
    console.error('[hosting/env] could not write .env:', err)
    await failHostingJob(guild.guild_id, 'env_write_failed')
    return NextResponse.json({ error: 'env_write_failed' }, { status: 500 })
  }

  const child = spawn(
    process.execPath,
    [join(process.cwd(), 'scripts', 'bot-provision.js'), guild.guild_id, '--restart-only'],
    { detached: true, stdio: 'ignore', env: process.env },
  )
  child.unref()

  return NextResponse.json({ ok: true }, { status: 202 })
}
