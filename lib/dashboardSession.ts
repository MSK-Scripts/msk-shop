import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Resolve the HMAC secret. Throws if SESSION_SECRET is unset rather than
 * falling back to a known placeholder — a missing secret in production would
 * otherwise let anyone forge dashboard sessions. Evaluated lazily.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

export interface DashboardSession {
  /**
   * The person (Discord user id) the dashboard session belongs to. The dashboard
   * is account-scoped: one signed session grants management of ALL guilds owned
   * by this Discord user. Each guild-scoped API route must additionally verify
   * `WHERE guild_id = ? AND discord_user_id = ?` before acting.
   */
  discordUserId: string;
}

/** Session lifetime — matches the cookie maxAge, but enforced server-side too so
 *  a leaked/copied token string is not valid forever (independent of the cookie). */
const SESSION_TTL_MS = 30 * 24 * 3600_000;   // 30 days

/** Payload actually written to the token: session data + an absolute expiry. */
interface SignedPayload extends DashboardSession {
  exp: number;   // ms epoch; enforced in parseDashboardSession
}

export function signDashboardSession(data: DashboardSession): string {
  const body: SignedPayload = { discordUserId: data.discordUserId, exp: Date.now() + SESSION_TTL_MS };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig     = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function parseDashboardSession(token: string): DashboardSession | null {
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
