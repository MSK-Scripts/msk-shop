import { NextRequest, NextResponse } from 'next/server'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { query }                     from '@/lib/db'
import { rateLimit, getClientIp }    from '@/lib/rateLimit'
import { archiveHostedBot }          from '@/lib/hostedBot'
import { discardStagedEnv }          from '@/lib/botProvision'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/bot-hosting/deactivate — the customer gives hosting up.
 *
 * Deliberately the exact same teardown the Stripe cancellation runs
 * (archiveHostedBot): stop and deregister the PM2 process, take the public host
 * down (vhost + DNS records), archive the directory, clear the flags. Two
 * separate teardown paths would drift, and the one that drifts is always the one
 * nobody exercises — a cancellation happens rarely, this button will be pressed
 * far more often, so sharing the code is what keeps the rare path honest.
 *
 * The directory is ARCHIVED, not deleted: it still holds the ticket history, and
 * a customer who turns hosting off by mistake at 2am should not lose it. The
 * daily cleanup cron hard-deletes archives after 14 days, which is also what the
 * privacy policy promises.
 *
 * Requires the guild id in the body as an explicit confirmation, so a stray GET
 * or a mis-wired fetch cannot tear down an installation.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const guild = auth.guild
  if (!guild.is_hosted) return NextResponse.json({ error: 'not_hosted' }, { status: 409 })

  if (!rateLimit(`hosting-deactivate:${guild.guild_id}`, { limit: 5, windowMs: 60 * 60_000 }) ||
      !rateLimit(`hosting-deactivate-ip:${getClientIp(req)}`, { limit: 10, windowMs: 60 * 60_000 })) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let confirm: string
  try {
    confirm = String(((await req.json()) as { confirm?: unknown })?.confirm ?? '')
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (confirm !== guild.guild_id) {
    return NextResponse.json({ error: 'confirm_mismatch' }, { status: 400 })
  }

  await archiveHostedBot(auth.guildId)
  await discardStagedEnv(guild.guild_id)
  // The job row describes an installation that no longer exists; leaving it
  // would show the customer a stale "failed" banner above an empty setup form.
  await query('DELETE FROM ticketbot_hosting_jobs WHERE guild_id = ?', [guild.guild_id])

  return NextResponse.json({ ok: true })
}
