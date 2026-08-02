/**
 * Eine Guild-Id, deren Herkunft geprüft ist.
 *
 * Das Problem, das dieser Typ löst: `query()` in `lib/db.ts` ist bewusst
 * ungescopet, die Mandanten-Isolation sitzt eine Ebene darüber. Bisher war das
 * reine Konvention — `authorizeGuild()` gab einen `string` zurück, und
 * `body.guildId` ist auch ein `string`. Ein neuer Aufruf, der den Prüfschritt
 * überspringt, kompilierte fehlerfrei.
 *
 * `ScopedGuildId` ist ein Branded Type: zur Laufzeit weiterhin ein String, für
 * den Compiler aber nur über zwei Wege erreichbar.
 *
 *   1. `authorizeGuild()` in `lib/dashboardAuth.ts` — Session plus
 *      `WHERE guild_id = ? AND discord_user_id = ?`.
 *   2. `trustedGuildId(id, reason)` hier — für Kontexte ohne Nutzersession, in
 *      denen die Id aus einer anderen geprüften Quelle stammt.
 *
 * Eine Funktion, die `ScopedGuildId` verlangt, lässt sich damit nicht mehr
 * versehentlich mit einem Wert aus dem Request-Body füttern.
 *
 * Ehrlich zur Reichweite: der Brand beweist die **Herkunft** der Id, nicht dass
 * das SQL sie auch benutzt. `teardownCustomDomain(scope)` könnte intern immer
 * noch die falsche Zeile anfassen. Er schließt genau die Lücke, die
 * `tests/routeGuards.test.ts` nur von außen abtasten kann, und keine andere.
 */

declare const GUILD_SCOPE: unique symbol

export type ScopedGuildId = string & { readonly [GUILD_SCOPE]: true }

/** Discord-Snowflake. Dieselbe Prüfung wie in `authorizeGuild()`. */
const GUILD_ID_RE = /^\d{17,20}$/

/**
 * Kontexte, in denen es keine Nutzersession gibt und die Id trotzdem geprüft
 * ist. Die Liste ist absichtlich eine geschlossene Union statt eines freien
 * Strings: ein neuer Umgehungsgrund muss hier eingetragen werden, und damit
 * wird er im Review sichtbar, statt in einem Kommentar zu verschwinden.
 */
export type TrustedGuildSource =
  /**
   * `authorizeGuild()` selbst. Die Id stammt aus einer Zeile, die bereits auf
   * `discord_user_id` der Session eingeschränkt war — der Hauptweg, kein
   * Umgehungsgrund. Steht hier, weil `authorizeGuild()` denselben Konstruktor
   * benutzt statt ein eigenes `as ScopedGuildId` zu schreiben.
   */
  | 'dashboard-session'
  /** Stripe-Webhook, Signatur gegen STRIPE_WEBHOOK_SECRET geprüft, Id aus `metadata.guild_id`. */
  | 'stripe-webhook'
  /** API-Key des Bots — die Guild wird aus dem Key abgeleitet, nie aus dem Body. */
  | 'api-key'
  /** Admin-Dashboard, `adminRoute()` hat Session, Recht und Origin bereits geprüft. */
  | 'admin-route'
  /** Wartungs-Cron ohne Request-Kontext (cleanup.js, stripe-reconcile.js). */
  | 'maintenance-cron'

/**
 * Markiert eine Guild-Id als geprüft, ohne Dashboard-Session.
 *
 * Das Format wird zur Laufzeit validiert und wirft bei einem Fehlschlag: der
 * Brand ist reine Compile-Zeit, ein `as ScopedGuildId` an dieser Stelle wäre
 * eine Behauptung ohne Deckung. Der Wurf ist gewollt — an keinem der
 * aufrufenden Orte ist eine unbrauchbare Guild-Id ein erwarteter Zustand, und
 * ein stiller `null`-Rückgabewert würde nur eine Ebene später zu einem
 * Update ohne `WHERE`-Treffer führen.
 */
export function trustedGuildId(guildId: string, source: TrustedGuildSource): ScopedGuildId {
  const id = String(guildId ?? '').trim()
  if (!GUILD_ID_RE.test(id)) {
    throw new Error(`[guildScope] invalid guild id from ${source}: ${JSON.stringify(guildId)}`)
  }
  return id as ScopedGuildId
}
