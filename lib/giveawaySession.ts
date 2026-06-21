import { createHmac, timingSafeEqual } from 'crypto';
import type { DiscordGuild } from './session';

// Eigene, gescopte Sessions für den Giveaway-Flow. Bewusst getrennt vom
// Ticketbot (`lib/dashboardSession.ts` / `lib/session.ts`): der HMAC bindet
// jeweils einen Scope mit ein, damit ein Ticketbot-Token nicht als Giveaway-
// Token gilt (und umgekehrt), obwohl alle dasselbe SESSION_SECRET nutzen.
/**
 * Resolve the HMAC secret. Throws if SESSION_SECRET is unset rather than
 * falling back to a known placeholder — a missing secret in production would
 * otherwise let anyone forge giveaway sessions. Evaluated lazily.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

function sign(scope: string, data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig     = createHmac('sha256', getSecret()).update(`${scope}:${payload}`).digest('base64url');
  return `${payload}.${sig}`;
}

function parse<T>(scope: string, token: string | undefined): T | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload  = token.substring(0, dot);
  const sig      = token.substring(dot + 1);
  const expected = createHmac('sha256', getSecret()).update(`${scope}:${payload}`).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as T;
  } catch {
    return null;
  }
}

// ── Finale Dashboard-Session ──────────────────────────────────────────────────
export interface GiveawaySession {
  guildId: string;
}

export function signGiveawaySession(data: GiveawaySession): string {
  return sign('giveaway', data);
}

export function parseGiveawaySession(token: string | undefined): GiveawaySession | null {
  const s = parse<GiveawaySession>('giveaway', token);
  return s && typeof s.guildId === 'string' ? s : null;
}

// ── Kurzlebige Zwischen-Session (nach OAuth, vor Guild-Auswahl) ───────────────
export interface GiveawayVerifyData {
  discordUserId: string;
  guilds: DiscordGuild[];
}

export function signGiveawayVerify(data: GiveawayVerifyData): string {
  return sign('giveaway-verify', data);
}

export function parseGiveawayVerify(token: string | undefined): GiveawayVerifyData | null {
  const s = parse<GiveawayVerifyData>('giveaway-verify', token);
  // Laufzeit-Formprüfung (Defense-in-Depth, auch wenn HMAC bereits geprüft ist).
  if (!s || typeof s.discordUserId !== 'string' || !Array.isArray(s.guilds)) return null;
  return s;
}

export const GIVEAWAY_SESSION_COOKIE = 'msk_giveaway_session';
