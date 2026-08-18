import { NextRequest, NextResponse } from 'next/server'
import {
  verifyHandoff, signProxySession, verifyProxySession, proxySecret,
  PROXY_COOKIE, PROXY_SECRET_HEADER, PROXY_USER_HEADER, PROXY_HOST, RETURN_URL,
  PROXY_SESSION_MAX_AGE_S,
} from '@/lib/botDashboardProxy'

// Node runtime: we fetch a loopback address and stream arbitrary responses, both
// of which the Edge runtime cannot do. force-dynamic: never cache a proxied hit.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// proxy.ts rewrites EVERY request on PROXY_HOST to this single route and
// carries the real path in x-proxy-path (the query string is preserved on the
// URL). We never build a path from anything the browser could smuggle past that.

// Hop-by-hop headers must not be forwarded in either direction (RFC 7230 §6.1).
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
])

const bounce = () => NextResponse.redirect(RETURN_URL, { status: 302 })

async function handle(req: NextRequest): Promise<NextResponse> {
  // This route only exists to serve the proxy host (proxy.ts rewrites to it).
  // Reject a direct hit on any other host so /_botproxy cannot be probed on the
  // main site, where a crafted x-proxy-path could otherwise be supplied.
  const reqHost = (req.headers.get('host') || '').toLowerCase().split(':')[0]
  if (reqHost !== PROXY_HOST) return new NextResponse('Not found', { status: 404 })

  const secret = proxySecret()
  if (!secret) return new NextResponse('The bot dashboard proxy is not configured.', { status: 503 })

  const path = req.headers.get('x-proxy-path') || '/'
  const search = req.nextUrl.search || ''

  // ── 1. Handoff entry: consume the token, set a host-only session, redirect ──
  if (path === '/__enter') {
    const claims = verifyHandoff(req.nextUrl.searchParams.get('h'))
    if (!claims) {
      return new NextResponse('This link is invalid or has expired. Please reopen the dashboard.', { status: 400 })
    }
    const session = signProxySession({
      discordUserId: claims.discordUserId,
      guildId:       claims.guildId,
      botPort:       claims.botPort,
    })
    // Redirect to the clean root of the proxy host so the token drops out of the
    // address bar and history.
    const res = NextResponse.redirect(`https://${PROXY_HOST}/`, { status: 302 })
    res.cookies.set(PROXY_COOKIE, session, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: PROXY_SESSION_MAX_AGE_S,
      // No Domain attribute → host-only, scoped to PROXY_HOST alone.
    })
    return res
  }

  // ── 2. Everything else requires a valid proxy session ───────────────────────
  const session = verifyProxySession(req.cookies.get(PROXY_COOKIE)?.value)
  if (!session) return bounce()

  // The bot's SPA sends the browser to /auth/login on a 401 and clears via
  // /auth/logout. In proxy mode there is no OAuth here, so short-circuit both to
  // a fresh handoff from msk-shop instead of forwarding them to the bot.
  if (path === '/auth/login' || path === '/auth/logout') {
    const res = bounce()
    if (path === '/auth/logout') res.cookies.set(PROXY_COOKIE, '', { path: '/', maxAge: 0 })
    return res
  }

  // ── 3. Forward to the loopback bot dashboard ────────────────────────────────
  const target = `http://127.0.0.1:${session.botPort}${path}${search}`

  const fwdHeaders = new Headers()
  for (const [k, v] of req.headers) {
    const key = k.toLowerCase()
    if (HOP_BY_HOP.has(key)) continue
    if (key === 'cookie') continue          // never leak msk-shop / proxy cookies to the bot
    if (key === 'host') continue            // let fetch set the loopback host
    if (key === 'x-proxy-path') continue    // internal routing header
    fwdHeaders.set(k, v)
  }
  // Trusted-proxy identity: the bot trusts these because it shares the secret.
  fwdHeaders.set(PROXY_SECRET_HEADER, secret)
  fwdHeaders.set(PROXY_USER_HEADER, session.discordUserId)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const body = hasBody ? await req.arrayBuffer() : undefined

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: fwdHeaders,
      body,
      redirect: 'manual',
      cache: 'no-store',
    } as RequestInit)
  } catch {
    return new NextResponse('The bot dashboard is not reachable. The bot may be stopped.', { status: 502 })
  }

  const respHeaders = new Headers()
  for (const [k, v] of upstream.headers) {
    if (HOP_BY_HOP.has(k.toLowerCase())) continue
    respHeaders.set(k, v)
  }
  // Stream the body straight through so Server-Sent Events (the live log console)
  // keep flowing instead of buffering.
  return new NextResponse(upstream.body, { status: upstream.status, headers: respHeaders })
}

export const GET     = handle
export const POST    = handle
export const PUT     = handle
export const PATCH   = handle
export const DELETE  = handle
export const HEAD    = handle
export const OPTIONS = handle
