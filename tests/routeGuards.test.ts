import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * Jede API-Route, die die Datenbank anfasst, braucht eine erkennbare Wache.
 *
 * Hintergrund: `query()` aus `lib/db.ts` hat 39 eingehende Kanten im
 * Codebase-Graphen und verbindet neun Communities, ist aber bewusst
 * **ungescopet** — die Mandanten-Isolation sitzt eine Ebene darüber, in vier
 * verschiedenen Vertrauensmodellen (Dashboard-Session, Admin-Session,
 * API-Key des Bots, Shared Secret).
 *
 * Genau das ist die Lücke: `authorizeGuild()` gibt die Guild nicht als eigenen
 * Typ zurück, den `query()` verlangen könnte. Eine neue Route, die `lib/db`
 * direkt importiert und den Schritt auslässt, kompiliert fehlerfrei und fällt
 * niemandem auf. Dieser Test schließt die Lücke von außen: er kennt kein SQL
 * und keine Semantik, er verlangt nur, dass eine der bekannten Wachen im
 * Quelltext vorkommt.
 *
 * Was er NICHT kann: prüfen, ob die Wache auch richtig **benutzt** wird. Eine
 * Route, die `authorizeGuild()` importiert und das Ergebnis ignoriert, kommt
 * hier durch. Der Test ist ein Netz gegen Vergessen, kein Beweis.
 */

const API_DIR = join(process.cwd(), 'app', 'api')

/**
 * Aufruf einer der genannten Funktionen, mit optionalem Typargument dazwischen.
 *
 * Das `(<[^(]*>)?` ist nicht kosmetisch: `adminRoute<{ guildId: string }>(…)`
 * wird sonst nicht erkannt, und der Test meldete beim ersten Lauf genau diese
 * zwei Admin-Routen als ungeschützt. `[^(]*` statt `[^>]*`, damit auch
 * verschachtelte Generics (`<Foo<Bar>>`) noch matchen.
 */
function callOf(...names: string[]): RegExp {
  return new RegExp(String.raw`\b(${names.join('|')})\s*(<[^(]*>)?\s*\(`)
}

/**
 * Die vier Vertrauensmodelle plus die beiden Sonderfälle, die kein Guild-Scope
 * haben können (OAuth-Rückkanal, Zahlungs-Webhook).
 *
 * Kommt eine neue Wache dazu, gehört sie hierher — nicht in die Allowlist.
 */
const GUARDS: Array<{ name: string; pattern: RegExp }> = [
  // Dashboard-Session: WHERE guild_id = ? AND discord_user_id = ?
  { name: 'authorizeGuild',   pattern: callOf('authorizeGuild') },
  // Admin-Session + Recht + Rate-Limit + Origin-Check + Audit-Log
  { name: 'adminRoute',       pattern: callOf('adminRoute', 'authorizeAdmin') },
  // API-Key des Bots — die Guild wird aus dem Key abgeleitet, nie aus dem Body
  { name: 'apiKey',           pattern: /\bextractApiKey\s*\(|WHERE\s+api_key\s*=\s*\?/ },
  // Signierte Verify-/Dashboard-/Giveaway-Session aus dem Cookie
  { name: 'signedSession',    pattern: callOf('parseSession', 'parseDashboardSession', 'parseGiveawaySession') },
  // Shared Secret des Bots, konstant-zeitig verglichen
  { name: 'sharedSecret',     pattern: callOf('timingSafeEqual') },
  // OAuth-Rückkanal: Code-Tausch + State-Abgleich, danach wird erst signiert
  { name: 'oauthCallback',    pattern: callOf('signAdminSession', 'signSession', 'signDashboardSession', 'signGiveawaySession') },
  // Stripe-Webhook: Signaturprüfung gegen STRIPE_WEBHOOK_SECRET
  { name: 'webhookSignature', pattern: callOf('constructEvent', 'constructEventAsync') },
]

/**
 * Routen, die absichtlich ohne Wache auskommen. Jeder Eintrag braucht einen
 * Grund, und der Grund muss die Frage beantworten: warum kann hier kein
 * fremder Mandant Daten sehen oder ändern?
 *
 * Die Liste wird unten auf Karteileichen geprüft — ein Eintrag, der nicht mehr
 * existiert oder die Datenbank nicht mehr anfasst, lässt den Test scheitern.
 * Sonst verrottet die Ausnahme still und deckt irgendwann etwas anderes.
 */
const PUBLIC_BY_DESIGN: Record<string, string> = {
  'stats/route.ts':
    'Öffentliche Statistikseite. Liefert ausschließlich Aggregate (COUNT, AVG, SUM, MAX) ' +
    'über alle Guilds, nie guild-bezogene Zeilen. Ein Guild-Scope wäre hier sinnlos.',
}

function routeFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...routeFiles(full))
    else if (entry.name === 'route.ts') out.push(full)
  }
  return out
}

/** Pfad relativ zu app/api, immer mit `/` — damit die Allowlist plattformgleich bleibt. */
function key(file: string): string {
  return relative(API_DIR, file).split(sep).join('/')
}

const ROUTES = routeFiles(API_DIR).map(file => ({
  key: key(file),
  source: readFileSync(file, 'utf8'),
}))

/** Routen, die `lib/db` importieren — direkt oder über einen Re-Export. */
const DB_ROUTES = ROUTES.filter(r => /from\s+['"]@\/lib\/db['"]/.test(r.source))

describe('API-Routen mit Datenbankzugriff', () => {
  it('findet überhaupt Routen (schützt vor einem still leeren Test)', () => {
    expect(ROUTES.length).toBeGreaterThan(20)
    expect(DB_ROUTES.length).toBeGreaterThan(15)
  })

  it.each(DB_ROUTES.map(r => r.key))('%s hat eine erkennbare Wache', routeKey => {
    const route = DB_ROUTES.find(r => r.key === routeKey)!
    const reason = PUBLIC_BY_DESIGN[routeKey]
    const matched = GUARDS.filter(g => g.pattern.test(route.source)).map(g => g.name)

    if (reason) {
      // Eine allowlistete Route DARF keine Wache haben — sonst gehört sie nicht
      // auf die Liste, und die Ausnahme verdeckt nur, dass sie längst gesichert ist.
      expect(
        matched,
        `${routeKey} steht in PUBLIC_BY_DESIGN, hat aber die Wache(n) ${matched.join(', ')}. ` +
        'Eintrag aus der Allowlist entfernen.',
      ).toEqual([])
      return
    }

    expect(
      matched.length,
      `${routeKey} importiert @/lib/db, aber keine der bekannten Wachen ` +
      `(${GUARDS.map(g => g.name).join(', ')}) kommt im Quelltext vor.\n` +
      'Entweder fehlt die Autorisierung, oder es gibt ein neues Muster — dann ' +
      'GUARDS in tests/routeGuards.test.ts ergänzen. Eine Ausnahme in ' +
      'PUBLIC_BY_DESIGN ist nur richtig, wenn die Route nachweislich keine ' +
      'mandantenbezogenen Daten liest oder schreibt.',
    ).toBeGreaterThan(0)
  })

  it('die Allowlist enthält keine Karteileichen', () => {
    const dbKeys = new Set(DB_ROUTES.map(r => r.key))
    const stale = Object.keys(PUBLIC_BY_DESIGN).filter(k => !dbKeys.has(k))
    expect(
      stale,
      `PUBLIC_BY_DESIGN nennt Routen, die es nicht (mehr) gibt oder die die ` +
      `Datenbank nicht mehr anfassen: ${stale.join(', ')}. Einträge entfernen.`,
    ).toEqual([])
  })

  it('jede Ausnahme trägt eine Begründung', () => {
    for (const [routeKey, reason] of Object.entries(PUBLIC_BY_DESIGN)) {
      expect(reason.length, `${routeKey} braucht eine echte Begründung`).toBeGreaterThan(40)
    }
  })
})
