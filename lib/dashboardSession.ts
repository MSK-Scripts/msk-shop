import { createHmac } from 'crypto';

const SECRET = process.env.SESSION_SECRET ?? 'change-me-in-production';

export interface DashboardSession {
  guildId: string;
}

export function signDashboardSession(data: DashboardSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig     = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function parseDashboardSession(token: string): DashboardSession | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload  = token.substring(0, dot);
  const sig      = token.substring(dot + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as DashboardSession;
  } catch {
    return null;
  }
}
