import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signierte Sitzung fuer Community-Uploads.
 *
 * Eigener Scope neben Ticketbot, Giveaway und Admin. Alle vier signieren mit
 * demselben `SESSION_SECRET`, aber der Scope geht in den HMAC ein, damit ein
 * Ticketbot-Token nicht als Upload-Token durchgeht und umgekehrt. Die Sitzung
 * traegt genau zwei Dinge: wer eingereicht hat und wie diese Person heisst.
 * Rechte haengen nicht daran — sie erlaubt nur, ein Bild in die Schlange zu
 * legen, und ueber jedes Bild entscheidet danach ein Mensch.
 */

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

interface Envelope<T> { d: T; exp: number }

const SCOPE   = 'image-upload'
const TTL_MS  = 7 * 24 * 3600_000   // 7 Tage

export interface UploadSession {
  discordUserId: string
  /** Anzeigename zum Zeitpunkt der Anmeldung. Nur zur Anzeige im Dashboard. */
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
