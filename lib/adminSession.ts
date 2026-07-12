import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Resolve the HMAC secret. Throws if SESSION_SECRET is unset rather than
 * falling back to a known placeholder — a missing secret in production would
 * otherwise let anyone forge admin sessions. Evaluated lazily.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

/** Cookie name for the signed admin session. */
export const ADMIN_SESSION_COOKIE = 'msk_admin_session';

/** Session lifetime — matches the cookie maxAge, but enforced server-side too. */
const SESSION_TTL_MS = 3600_000;

export interface AdminSession {
  /**
   * The Discord user id the admin session belongs to. Permissions are NOT stored
   * here — they are loaded live from `msk_admin_team` on every request so that a
   * revocation takes effect immediately. The session only proves identity.
   */
  discordUserId: string;
}

/** Payload actually written to the token: session data + an absolute expiry. */
interface SignedPayload extends AdminSession {
  exp: number;   // ms epoch; enforced in parseAdminSession
}

export function signAdminSession(data: AdminSession): string {
  const body: SignedPayload = { discordUserId: data.discordUserId, exp: Date.now() + SESSION_TTL_MS };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig     = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function parseAdminSession(token: string): AdminSession | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload  = token.substring(0, dot);
  const sig      = token.substring(dot + 1);
  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  // Constant-time comparison to avoid signature-forgery timing side channels.
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SignedPayload;
    // Enforce expiry server-side — a leaked token string is not valid forever.
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    if (!data.discordUserId) return null;
    return { discordUserId: data.discordUserId };
  } catch {
    return null;
  }
}
