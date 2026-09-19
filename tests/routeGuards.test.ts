import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/**
 * Every API route that touches the database needs a recognisable guard.
 *
 * Background: `query()` from `lib/db.ts` has 39 incoming edges in the
 * codebase graph and connects nine communities, but it is deliberately
 * **unscoped**: tenant isolation sits one level above it, in four
 * different trust models (dashboard session, admin session,
 * the bot's API key, shared secret).
 *
 * That is exactly the gap: `authorizeGuild()` does not return the guild as its
 * own type that `query()` could require. A new route that imports `lib/db`
 * directly and skips the step compiles without errors and nobody
 * notices. This test closes the gap from the outside: it knows no SQL
 * and no semantics, it only requires that one of the known guards appears in
 * the source.
 *
 * What it can NOT do: check whether the guard is also **used** correctly. A
 * route that imports `authorizeGuild()` and ignores the result gets
 * through here. The test is a net against forgetting, not a proof.
 */

const API_DIR = join(process.cwd(), 'app', 'api')

/**
 * Call of one of the named functions, with an optional type argument in between.
 *
 * The `(<[^(]*>)?` is not cosmetic: `adminRoute<{ guildId: string }>(…)`
 * is not recognised otherwise, and on its first run the test reported exactly
 * these two admin routes as unprotected. `[^(]*` instead of `[^>]*`, so that
 * nested generics (`<Foo<Bar>>`) still match.
 */
function callOf(...names: string[]): RegExp {
  return new RegExp(String.raw`\b(${names.join('|')})\s*(<[^(]*>)?\s*\(`)
}

/**
 * The four trust models plus the two special cases that cannot have a guild
 * scope (OAuth return channel, payment webhook).
 *
 * If a new guard is added, it belongs here, not in the allowlist.
 */
const GUARDS: Array<{ name: string; pattern: RegExp }> = [
  // Dashboard session: WHERE guild_id = ? AND discord_user_id = ?
  { name: 'authorizeGuild',   pattern: callOf('authorizeGuild') },
  // Admin session + permission + rate limit + origin check + audit log
  { name: 'adminRoute',       pattern: callOf('adminRoute', 'authorizeAdmin') },
  // The bot's API key: the guild is derived from the key, never from the body
  { name: 'apiKey',           pattern: /\bextractApiKey\s*\(|WHERE\s+api_key\s*=\s*\?/ },
  // Signed verify/dashboard/giveaway session from the cookie
  { name: 'signedSession',    pattern: callOf('parseSession', 'parseDashboardSession', 'parseGiveawaySession', 'parseUploadSession') },
  // The bot's shared secret, compared in constant time
  { name: 'sharedSecret',     pattern: callOf('timingSafeEqual') },
  // OAuth return channel: code exchange + state check, signing only happens afterwards
  { name: 'oauthCallback',    pattern: callOf('signAdminSession', 'signSession', 'signDashboardSession', 'signGiveawaySession') },
  // Stripe webhook: signature check against STRIPE_WEBHOOK_SECRET
  { name: 'webhookSignature', pattern: callOf('constructEvent', 'constructEventAsync') },
]

/**
 * Routes that deliberately get by without a guard. Every entry needs a
 * reason, and the reason has to answer the question: why can no
 * other tenant see or change data here?
 *
 * The list is checked for dead entries below: an entry that no longer
 * exists or no longer touches the database makes the test fail.
 * Otherwise the exception rots silently and at some point covers something else.
 */
const PUBLIC_BY_DESIGN: Record<string, string> = {
  'stats/route.ts':
    'Öffentliche Statistikseite. Liefert ausschließlich Aggregate (COUNT, AVG, SUM, MAX) ' +
    'über alle Guilds, nie guild-bezogene Zeilen. Ein Guild-Scope wäre hier sinnlos.',

  // Die drei folgenden Galerie-Routen tauchen hier erst seit dem 19.09.2026
  // auf, weil dieser Test bis dahin nur direkte @/lib/db-Importe gesehen hat.
  // Sie waren die ganze Zeit ungeschützt, und das ist richtig so: der
  // Bildbestand ist der öffentliche Katalog, den das CDN ohnehin für jeden
  // ausliefert.
  'images/route.ts':
    'Öffentlicher Bildkatalog. Liest ausschließlich freigegebene Zeilen aus msk_images ' +
    '(lib/images.ts verdrahtet status = published fest), keine Mandantendaten.',
  'images/categories/route.ts':
    'Öffentliche Kategorieliste der Bildergalerie. Liest nur msk_image_categories ' +
    'mit is_public = 1.',
  'images/[category]/[name]/route.ts':
    'Einzelnes öffentliches Bild aus msk_images, dieselbe Zeile, die das CDN ' +
    'ohne jede Prüfung ausliefert.',

  // Die drei Pflichtformulare. Sie schreiben, aber jede Zeile gehört dem
  // Absender und niemandem sonst: es gibt keine Abfrage, die sie je wieder
  // an einen Besucher ausliefert, gelesen werden sie nur per Mail und von
  // Hand in der Datenbank.
  'legal/withdrawal/route.ts':
    'Widerrufsformular nach § 356a BGB, muss ohne Login erreichbar sein. Schreibt eine ' +
    'Erklärung, die der Absender selbst abgibt; CSRF über originAllowed(), Missbrauch ' +
    'über die IP im Datensatz nachvollziehbar.',
  'legal/cancellation/route.ts':
    'Kündigungsformular nach § 312k Abs. 2 BGB. Muss ausdrücklich ohne Login und ohne ' +
    'Anmeldung erreichbar sein, das ist der Zweck der Vorschrift. Sonst wie oben.',
  'legal/report/route.ts':
    'Meldeformular nach Art. 16 DSA, ebenfalls ohne Login erreichbar. Sonst wie oben.',
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

/** Path relative to app/api, always with `/`, so the allowlist stays the same on every platform. */
function key(file: string): string {
  return relative(API_DIR, file).split(sep).join('/')
}

const ROUTES = routeFiles(API_DIR).map(file => ({
  key: key(file),
  source: readFileSync(file, 'utf8'),
}))

/**
 * Which `lib/` modules reach the database, transitively.
 *
 * Until 19.09.2026 this test only looked for a direct `@/lib/db` import in the
 * route file. Moving the statistics queries out of `app/api/stats/route.ts`
 * into `lib/ticketbotStats.ts` silently removed that route from this test's
 * scope, and the only reason anybody noticed is that the allowlist then
 * complained about a dead entry. Without that second check the route would
 * have dropped out unannounced, and so would every future route that reads
 * through a lib module rather than calling `query()` itself.
 *
 * The fixed point is computed rather than hand-listed: `lib/adminApi.ts`
 * reaches the database through `lib/adminAuth.ts`, and a list would have gone
 * stale at the first such link.
 */
const LIB_DIR = join(process.cwd(), 'lib')

function libFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...libFiles(full))
    else if (entry.name.endsWith('.ts')) out.push(full)
  }
  return out
}

/** `@/lib/foo` and `@/lib/sub/bar` as they appear in an import. */
function libImports(source: string): string[] {
  return [...source.matchAll(/from\s+['"]@\/(lib\/[\w./-]+)['"]/g)].map(m => m[1])
}

const LIB_SOURCES = new Map<string, string>(
  libFiles(LIB_DIR).map(file => [
    `lib/${relative(LIB_DIR, file).split(sep).join('/').replace(/\.ts$/, '')}`,
    readFileSync(file, 'utf8'),
  ]),
)

/** Modules that reach `lib/db`, grown until nothing new comes in. */
const DB_MODULES = new Set<string>(['lib/db'])
for (let changed = true; changed;) {
  changed = false
  for (const [name, source] of LIB_SOURCES) {
    if (DB_MODULES.has(name)) continue
    if (libImports(source).some(dep => DB_MODULES.has(dep))) {
      DB_MODULES.add(name)
      changed = true
    }
  }
}

/** Routes that reach the database, directly or through a lib module. */
const DB_ROUTES = ROUTES.filter(r => libImports(r.source).some(dep => DB_MODULES.has(dep)))

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
      // An allowlisted route MUST NOT have a guard; otherwise it does not belong
      // on the list, and the exception only hides that it has long been secured.
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
