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

// Signed tokens carry an absolute expiry (`exp`, ms epoch) inside the HMAC-signed
// envelope, enforced on parse — so a leaked/copied token string is not valid
// forever, independent of the client-controlled cookie maxAge.
interface Envelope<T> { d: T; exp: number; }

function sign(scope: string, data: unknown, ttlMs: number): string {
  const envelope: Envelope<unknown> = { d: data, exp: Date.now() + ttlMs };
  const payload = Buffer.from(JSON.stringify(envelope)).toString('base64url');
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
    const env = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Envelope<T>;
    if (typeof env.exp !== 'number' || env.exp < Date.now()) return null;
    return env.d;
  } catch {
    return null;
  }
}

// ── Finale Dashboard-Session ──────────────────────────────────────────────────
export interface GiveawaySession {
  guildId: string;
  /**
   * Discord-ID des eingeloggten Users. Wird an den Bot durchgereicht, damit der
   * für die Tebex-Routen selbst gegen `guild.ownerId` prüfen kann. Fehlt bei
   * Sessions, die vor dieser Erweiterung ausgestellt wurden.
   */
  userId?: string;
  /**
   * Ob der User Besitzer dieser Guild ist. Steuert NUR die Anzeige — die
   * Berechtigung entscheidet der Bot, und zwar gegen Discord statt gegen dieses
   * Feld. Ein manipuliertes Flag brächte hier also nichts.
   */
  owner?: boolean;
}

// Final dashboard session lives 30 days; the intermediate post-OAuth token is
// short-lived (just the guild-selection step).
const SESSION_TTL_MS = 30 * 24 * 3600_000;   // 30 days
const VERIFY_TTL_MS  = 15 * 60_000;          // 15 minutes

export function signGiveawaySession(data: GiveawaySession): string {
  return sign('giveaway', data, SESSION_TTL_MS);
}

export function parseGiveawaySession(token: string | undefined): GiveawaySession | null {
  const s = parse<GiveawaySession>('giveaway', token);
  return s && typeof s.guildId === 'string' ? s : null;
}

// ── Kurzlebige Zwischen-Session (nach OAuth, vor Guild-Auswahl) ───────────────
/** Guild aus der OAuth-Liste, um das Besitzer-Flag ergänzt. */
export type GiveawayGuild = DiscordGuild & { owner?: boolean };

export interface GiveawayVerifyData {
  discordUserId: string;
  guilds: GiveawayGuild[];
}

export function signGiveawayVerify(data: GiveawayVerifyData): string {
  return sign('giveaway-verify', data, VERIFY_TTL_MS);
}

export function parseGiveawayVerify(token: string | undefined): GiveawayVerifyData | null {
  const s = parse<GiveawayVerifyData>('giveaway-verify', token);
  // Laufzeit-Formprüfung (Defense-in-Depth, auch wenn HMAC bereits geprüft ist).
  if (!s || typeof s.discordUserId !== 'string' || !Array.isArray(s.guilds)) return null;
  return s;
}

export const GIVEAWAY_SESSION_COOKIE = 'msk_giveaway_session';
