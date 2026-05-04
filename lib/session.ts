import { createHmac, randomBytes } from 'crypto';

const SECRET = process.env.SESSION_SECRET ?? 'change-me-in-production';

export interface DiscordGuild {
  id:   string;
  name: string;
  icon: string | null;
}

export interface VerifySession {
  githubUsername?: string;
  guilds?:         DiscordGuild[];
}

/** Generate a random state token for OAuth CSRF protection. */
export function generateState(): string {
  return randomBytes(16).toString('hex');
}

/** Sign a session payload into a cookie-safe string. */
export function signSession(data: VerifySession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig     = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/** Parse and verify a signed session string. Returns null if invalid. */
export function parseSession(token: string): VerifySession | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload  = token.substring(0, dot);
  const sig      = token.substring(dot + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as VerifySession;
  } catch {
    return null;
  }
}
