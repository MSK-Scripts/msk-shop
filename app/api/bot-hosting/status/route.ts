import { NextRequest, NextResponse } from 'next/server'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { findArchives, getHostingJob } from '@/lib/botProvision'
import { dashboardRedirectUri, dashboardUrl } from '@/lib/dashboardHost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/bot-hosting/status — what the setup is currently doing.
 *
 * Polled by the dashboard while the detached worker installs. Returns the job
 * row plus the two addresses, so a finished run can render the result without a
 * second request and without a page reload.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const guild = auth.guild
  const job   = await getHostingJob(guild.guild_id)

  // Only interesting before hosting exists: it is the moment the customer has to
  // decide between bringing an archived installation back and starting over.
  const archives = guild.is_hosted ? [] : await findArchives(guild.guild_id).catch(() => [])

  const host = guild.dashboard_domain_status === 'active' && guild.dashboard_domain
    ? guild.dashboard_domain
    : guild.dashboard_host

  return NextResponse.json({
    // Wrapped under a key because lib/useAdminResource.ts unwraps exactly one,
    // the same shape every other list endpoint in this app answers with.
    status: {
    hosted:      !!guild.is_hosted,
    archives,
    host,
    url:         host ? dashboardUrl(host) : null,
    redirectUri: host ? dashboardRedirectUri(host) : null,
    job: job && {
      status: job.status,
      step:   job.step,
      error:  job.error,
      log:    job.log,
    },
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
