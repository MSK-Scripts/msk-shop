import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Resolve the HMAC secret. Throws if SESSION_SECRET is unset rather than
 * falling back to a known placeholder — a missing secret in production would
 * otherwise let anyone forge sessions. Evaluated lazily (on sign/parse), so a
 * build without the env var still compiles; only runtime use requires it.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

export interface DiscordGuild {
  id:   string;
  name: string;
  icon: string | null;
}

export interface VerifySession {
  discordUserId?:   string;
  guilds?:          DiscordGuild[];
}

/** Generate a random state token for OAuth CSRF protection. */
export function generateState(): string {
  return randomBytes(16).toString('hex');
}

/** Sign a session payload into a cookie-safe string. */
export function signSession(data: VerifySession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig     = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/** Parse and verify a signed session string. Returns null if invalid. */
export function parseSession(token: string): VerifySession | null {
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
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as VerifySession;
  } catch {
    return null;
  }
}
