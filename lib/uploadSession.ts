import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signed session for community uploads.
 *
 * Its own scope next to ticketbot, giveaway and admin. All four sign with the
 * same `SESSION_SECRET`, but the scope goes into the HMAC, so that a ticketbot
 * token does not pass as an upload token and vice versa. The session carries
 * exactly two things: who submitted and what that person is called.
 * No permissions hang on it: it only allows putting an image into the queue,
 * and a human decides about every image afterwards.
 */

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

interface Envelope<T> { d: T; exp: number }

const SCOPE   = 'image-upload'
const TTL_MS  = 7 * 24 * 3600_000   // 7 days

export interface UploadSession {
  discordUserId: string
  /** Display name at the time of login. Only for display in the dashboard. */
  displayName:   string | null
}

export function signUploadSession(data: UploadSession): string {
  const envelope: Envelope<UploadSession> = { d: data, exp: Date.now() + TTL_MS }
  const payload = Buffer.from(JSON.stringify(envelope)).toString('base64url')
  const sig     = createHmac('sha256', getSecret()).update(`${SCOPE}:${payload}`).digest('base64url')
  return `${payload}.${sig}`
}

export function parseUploadSession(token: string | undefined): UploadSession | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null

  const payload  = token.substring(0, dot)
  const sig      = token.substring(dot + 1)
  const expected = createHmac('sha256', getSecret()).update(`${SCOPE}:${payload}`).digest('base64url')

  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null

  try {
    const env = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Envelope<UploadSession>
    if (typeof env.exp !== 'number' || env.exp < Date.now()) return null
    const d = env.d
    if (!d || typeof d.discordUserId !== 'string') return null
    return { discordUserId: d.discordUserId, displayName: typeof d.displayName === 'string' ? d.displayName : null }
  } catch {
    return null
  }
}

export const UPLOAD_SESSION_COOKIE = 'msk_upload_session'
export const UPLOAD_STATE_COOKIE   = 'msk_upload_oauth_state'
