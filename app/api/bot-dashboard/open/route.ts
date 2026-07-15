import { NextRequest, NextResponse } from 'next/server'
import { authorizeGuild }            from '@/lib/dashboardAuth'
import { signHandoff, proxySecret, PROXY_HOST } from '@/lib/botDashboardProxy'

// Node runtime: the signing helpers use node:crypto.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mint a one-time handoff link into the proxied bot dashboard.
 *
 * Auth is the SAME account-scoped ownership check the other hosted routes use
 * (authorizeGuild → session + WHERE guild_id = ? AND discord_user_id = ?), so a
 * caller can only ever open a dashboard for a guild they own. The returned URL
 * carries a short-lived signed token; the proxy host validates it and sets its
 * own scoped session cookie.
 */
export async function GET(req: NextRequest) {
  if (!proxySecret()) {
    return NextResponse.json({ error: 'The bot dashboard proxy is not configured.' }, { status: 503 })
  }

  const auth = await authorizeGuild(req.nextUrl.searchParams.get('guildId'))
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const g = auth.guild
  if (!g.is_hosted || !g.active) {
    return NextResponse.json({ error: 'Not available for this account' }, { status: 403 })
  }
  if (!g.bot_port) {
    return NextResponse.json({ error: 'This bot has no dashboard port assigned yet.' }, { status: 409 })
  }

  const token = signHandoff({ discordUserId: auth.discordUserId, guildId: g.guild_id, botPort: g.bot_port })
  const url   = `https://${PROXY_HOST}/__enter?h=${encodeURIComponent(token)}`
  return NextResponse.json({ url })
}
