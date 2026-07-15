import { createHmac, timingSafeEqual } from 'crypto'

// =============================================================================
// Bot-dashboard reverse proxy — signing + config helpers
// =============================================================================
// A hosted bot runs its own self-hosted dashboard bound to 127.0.0.1:<bot_port>.
// It is never exposed directly; instead msk-shop is the authenticated gateway in
// front of it on a dedicated host (BOT_DASHBOARD_HOST). Flow:
//
//   1. The owner clicks "Open bot dashboard" in the (already authenticated)
//      msk-shop dashboard → GET /api/bot-dashboard/open?guildId=… mints a short
//      lived HANDOFF token bound to { discordUserId, guildId, botPort }.
//   2. A new tab opens https://<BOT_DASHBOARD_HOST>/__enter?h=<token>. The proxy
//      validates it and sets a host-only PROXY_COOKIE (a longer-lived session
//      scoped to the proxy host only — the main msk-shop cookie is NOT broadened
//      to subdomains).
//   3. Every further request on that host is forwarded to http://127.0.0.1:<port>
//      with the trusted-proxy headers the bot expects (shared secret + verified
//      Discord user id). The bot trusts identity only; it still resolves the
//      user's permissions from its own DB.
//
// Two independent secrets are involved:
//   • SESSION_SECRET signs the handoff/proxy-session tokens (msk-shop internal).
//   • BOT_DASHBOARD_PROXY_SECRET is the shared secret the BOT trusts; it must
//     equal DASHBOARD_TRUST_PROXY_SECRET in each hosted bot's .env.
// =============================================================================

const HANDOFF_TTL_MS       = 60_000          // 1 min: minted then immediately consumed
const PROXY_SESSION_TTL_MS = 60 * 60_000     // 1 h subdomain session

export const PROXY_COOKIE        = 'bot_dash_proxy'
export const PROXY_SECRET_HEADER = 'x-dashboard-proxy-secret'
export const PROXY_USER_HEADER   = 'x-dashboard-user'

/** The dedicated host the bot dashboard is proxied under. */
export const PROXY_HOST = (process.env.BOT_DASHBOARD_HOST || 'bot-dashboard.msk-scripts.de').toLowerCase()

/** Where to bounce a browser that arrives without a valid proxy session. */
export const RETURN_URL = process.env.BOT_DASHBOARD_RETURN_URL || 'https://www.msk-scripts.de/ticketbot/dashboard'

const SNOWFLAKE_RE = /^\d{17,20}$/

function signingSecret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET is not set')
  return s
}

/**
 * The shared secret the bot trusts. Returns null when unset or too weak, which
 * every caller treats as "the proxy is not configured" (503) rather than
 * forwarding an unauthenticated request.
 */
export function proxySecret(): string | null {
  const s = (process.env.BOT_DASHBOARD_PROXY_SECRET || '').trim()
  return s.length >= 32 ? s : null
}

export interface ProxyClaims {
  discordUserId: string
  guildId:       string
  botPort:       number
  exp:           number
}

function sign(scope: string, payloadB64: string): string {
  return createHmac('sha256', signingSecret()).update(`${scope}:${payloadB64}`).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

function makeToken(scope: string, claims: Omit<ProxyClaims, 'exp'>, ttlMs: number): string {
  const payload: ProxyClaims = { ...claims, exp: Date.now() + ttlMs }
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${b64}.${sign(scope, b64)}`
}

function readToken(scope: string, token: string | undefined | null): ProxyClaims | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null

  const b64 = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!safeEqual(sig, sign(scope, b64))) return null

  let claims: ProxyClaims
  try {
    claims = JSON.parse(Buffer.from(b64, 'base64url').toString()) as ProxyClaims
  } catch {
    return null
  }

  // A correctly signed but expired token must be rejected — the exp is inside the
  // signed payload, so it cannot be tampered with.
  if (!claims || typeof claims.exp !== 'number' || claims.exp < Date.now()) return null
  if (!SNOWFLAKE_RE.test(String(claims.discordUserId))) return null
  if (!SNOWFLAKE_RE.test(String(claims.guildId))) return null
  if (!Number.isInteger(claims.botPort) || claims.botPort < 1 || claims.botPort > 65535) return null

  return { discordUserId: claims.discordUserId, guildId: claims.guildId, botPort: claims.botPort, exp: claims.exp }
}

export const signHandoff       = (c: Omit<ProxyClaims, 'exp'>) => makeToken('bot-handoff', c, HANDOFF_TTL_MS)
export const verifyHandoff     = (t?: string | null) => readToken('bot-handoff', t)
export const signProxySession  = (c: Omit<ProxyClaims, 'exp'>) => makeToken('bot-proxysession', c, PROXY_SESSION_TTL_MS)
export const verifyProxySession = (t?: string | null) => readToken('bot-proxysession', t)

export const PROXY_SESSION_MAX_AGE_S = Math.floor(PROXY_SESSION_TTL_MS / 1000)
