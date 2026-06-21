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
  guildId: string;
  /**
   * GitHub account the guild is registered to. Bound into the signed token at
   * issuance for traceability and defense-in-depth (the cookie already proves
   * ownership via the signature). Optional for backwards-compatibility with
   * tokens issued before this field existed.
   */
  githubUsername?: string;
}

export function signDashboardSession(data: DashboardSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
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
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as DashboardSession;
  } catch {
    return null;
  }
}
