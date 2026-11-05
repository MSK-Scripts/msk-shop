import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// =============================================================================
// GitHub Sponsors -> Discord role: link tokens, state cookie, bearer check, env
// =============================================================================
// The Discord bot (discord_multibot) answers a click on its "Verify" button with
// a personal link into the shop:
//
//   ${NEXT_PUBLIC_BASE_URL}/api/sponsor/start?t=<token>
//   token = base64url(JSON payload) + "." + base64url(HMAC-SHA256(
//             key  = SPONSOR_LINK_SECRET,
//             data = "sponsor-link." + base64url(JSON payload)))
//   payload = { v: 1, d: <discord user id>, g: <guild id>, exp: <unix s>, n: <hex nonce> }
//
// The bot implements the same contract, so nothing here may drift from it:
// the prefix, the field names, seconds (not milliseconds) in `exp`.
//
// The shop then keeps `{ discordId, state }` for the GitHub OAuth round trip in
// a short-lived signed cookie. That cookie is signed with the same secret under
// a different prefix ("sponsor-state."), so a link token can never pass as a
// cookie or the other way round.
// =============================================================================

export const SNOWFLAKE_RE = /^\d{17,20}$/
/** GitHub login: 1 to 39 characters, alphanumeric or single hyphens. */
export const GITHUB_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/

const LINK_PREFIX  = 'sponsor-link.'
const STATE_PREFIX = 'sponsor-state.'

/** Lifetime of the link the bot hands out. The bot sets `exp`, this is documentation. */
export const SPONSOR_LINK_TTL_S = 15 * 60
/** Lifetime of the OAuth state cookie. */
export const SPONSOR_STATE_TTL_S = 10 * 60
export const SPONSOR_STATE_COOKIE = 'msk_sponsor_state'
// The OAuth state sits in its own plain cookie, compared with the `state`
// query parameter in the callback (the same pattern as the Discord verify
// login). It stays out of the signed cookie on purpose: a random value fed
// into the HMAC reads to CodeQL as a password hashed with SHA-256.
export const SPONSOR_OAUTH_STATE_COOKIE = 'msk_sponsor_oauth_state'

const MIN_SECRET_LENGTH = 32

// ── Configuration ────────────────────────────────────────────────────────────

export interface SponsorConfig {
  linkSecret:     string
  clientId:       string
  clientSecret:   string
  sponsorsToken:  string
  githubOrg:      string
  botToken:       string
  guildId:        string
  roleId:         string
}

type Env = Record<string, string | undefined>

function env(e: Env, name: string): string {
  return (e[name] ?? '').trim()
}

/**
 * Everything the browser flow (start + callback) needs. Returns the names of
 * the missing or invalid variables instead of a config, never their values,
 * so the caller can log one clear line and fail closed.
 */
export function readSponsorConfig(e: Env = process.env): { ok: true; config: SponsorConfig } | { ok: false; missing: string[] } {
  const missing: string[] = []
  const linkSecret = env(e, 'SPONSOR_LINK_SECRET')
  if (linkSecret.length < MIN_SECRET_LENGTH) missing.push('SPONSOR_LINK_SECRET (min. 32 chars)')

  const required = ['GITHUB_SPONSOR_CLIENT_ID', 'GITHUB_SPONSOR_CLIENT_SECRET', 'GITHUB_SPONSORS_TOKEN', 'SPONSOR_DISCORD_BOT_TOKEN']
  for (const name of required) if (!env(e, name)) missing.push(name)

  const guildId = env(e, 'SPONSOR_GUILD_ID')
  if (!SNOWFLAKE_RE.test(guildId)) missing.push('SPONSOR_GUILD_ID (snowflake)')
  const roleId = env(e, 'SPONSOR_ROLE_ID')
  if (!SNOWFLAKE_RE.test(roleId)) missing.push('SPONSOR_ROLE_ID (snowflake)')

  const githubOrg = env(e, 'SPONSOR_GITHUB_ORG') || 'MSK-Scripts'
  if (!GITHUB_LOGIN_RE.test(githubOrg)) missing.push('SPONSOR_GITHUB_ORG (GitHub login)')

  if (missing.length) return { ok: false, missing }
  return {
    ok: true,
    config: {
      linkSecret,
      clientId:      env(e, 'GITHUB_SPONSOR_CLIENT_ID'),
      clientSecret:  env(e, 'GITHUB_SPONSOR_CLIENT_SECRET'),
      sponsorsToken: env(e, 'GITHUB_SPONSORS_TOKEN'),
      githubOrg,
      botToken:      env(e, 'SPONSOR_DISCORD_BOT_TOKEN'),
      guildId,
      roleId,
    },
  }
}

/** The bearer secret of the members endpoint, or null when unset or too short. */
export function readSyncSecret(e: Env = process.env): string | null {
  const s = env(e, 'SPONSOR_SYNC_SECRET')
  return s.length >= MIN_SECRET_LENGTH ? s : null
}

// ── Primitives ───────────────────────────────────────────────────────────────

function hmac(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

/** Constant-time string comparison; different lengths are simply unequal. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

function splitToken(token: string | null | undefined): { b64: string; sig: string } | null {
  if (!token || token.length > 2048) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0 || dot === token.length - 1) return null
  return { b64: token.slice(0, dot), sig: token.slice(dot + 1) }
}

function decodeJson(b64: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}

// ── Link token (created by the bot) ──────────────────────────────────────────

export interface LinkPayload {
  v:   1
  d:   string
  g:   string
  exp: number
  n:   string
}

/**
 * Creates a link token exactly as the bot does. The shop never hands one out;
 * this exists for the tests and as the reference for the contract.
 */
export function signLinkToken(payload: LinkPayload, secret: string): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${b64}.${hmac(secret, LINK_PREFIX + b64)}`
}

/**
 * Checks a link token from the bot. Returns the Discord user id, or null for
 * anything that is not a valid, unexpired token for our guild.
 */
export function verifyLinkToken(
  token: string | null | undefined,
  opts: { secret: string; guildId: string; nowMs?: number },
): { discordId: string } | null {
  const parts = splitToken(token)
  if (!parts) return null
  if (!safeEqual(parts.sig, hmac(opts.secret, LINK_PREFIX + parts.b64))) return null

  const p = decodeJson(parts.b64)
  if (!p) return null
  const now = Math.floor((opts.nowMs ?? Date.now()) / 1000)
  if (p.v !== 1) return null
  if (typeof p.exp !== 'number' || !Number.isFinite(p.exp) || p.exp <= now) return null
  if (typeof p.d !== 'string' || !SNOWFLAKE_RE.test(p.d)) return null
  if (typeof p.g !== 'string' || !SNOWFLAKE_RE.test(p.g)) return null
  if (p.g !== opts.guildId) return null
  return { discordId: p.d }
}

// ── OAuth state cookie (shop internal) ───────────────────────────────────────

export interface SponsorState {
  discordId: string
}

export function newOAuthState(): string {
  return randomBytes(16).toString('hex')
}

export function signStateCookie(value: SponsorState, secret: string, nowMs: number = Date.now()): string {
  const exp = Math.floor(nowMs / 1000) + SPONSOR_STATE_TTL_S
  const b64 = Buffer.from(JSON.stringify({ d: value.discordId, exp })).toString('base64url')
  return `${b64}.${hmac(secret, STATE_PREFIX + b64)}`
}

export function readStateCookie(cookie: string | null | undefined, secret: string, nowMs: number = Date.now()): SponsorState | null {
  const parts = splitToken(cookie)
  if (!parts) return null
  if (!safeEqual(parts.sig, hmac(secret, STATE_PREFIX + parts.b64))) return null

  const p = decodeJson(parts.b64)
  if (!p) return null
  if (typeof p.exp !== 'number' || p.exp <= Math.floor(nowMs / 1000)) return null
  if (typeof p.d !== 'string' || !SNOWFLAKE_RE.test(p.d)) return null
  return { discordId: p.d }
}

// ── Result page ──────────────────────────────────────────────────────────────

/**
 * What the result page (`/sponsor/verify`, German `/sponsor/verifizieren`) can
 * report. Anything else in `?status=` reads as `error`.
 */
export const SPONSOR_STATUSES = [
  'granted',
  'linked_no_sponsorship',
  'role_failed',
  'link_invalid',
  'rate_limited',
  'error',
] as const
export type SponsorStatus = (typeof SPONSOR_STATUSES)[number]

export function parseSponsorStatus(value: unknown): SponsorStatus {
  return (SPONSOR_STATUSES as readonly unknown[]).includes(value) ? value as SponsorStatus : 'error'
}

// ── Members endpoint ─────────────────────────────────────────────────────────

/** `Authorization: Bearer <secret>`, compared in constant time. */
export function bearerMatches(header: string | null, secret: string): boolean {
  const m = /^Bearer\s+(\S+)$/.exec(header ?? '')
  return !!m && safeEqual(m[1], secret)
}
