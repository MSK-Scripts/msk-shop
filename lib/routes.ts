import type { Lang } from '@/lib/i18n'
import { DEFAULT_LANG, LANGS, isLang } from '@/lib/lang'

/**
 * The route table: one place that knows what every page is called in every
 * language.
 *
 * Every page exists exactly once in the code, under `app/[lang]/` with an
 * English folder name. That folder path is the **internal path**, and it is
 * also the English public path. The German public path can translate any
 * segment (`/legal/terms` becomes `/rechtliches/agb`), so the proxy rewrites
 * the German form onto the internal one. Links, the language switcher,
 * hreflang, canonical and the sitemap all ask this module, which is why a
 * renamed address is one line here and nothing anywhere else.
 *
 * Rules the tests hold this table to:
 *   - every entry has a public form in every language,
 *   - public -> internal -> public returns the start, in both languages,
 *   - no two entries share a public form, within or across languages,
 *   - public and internal forms have the same segments in the same places
 *     (a dynamic segment stays dynamic, it only keeps its value).
 *
 * Below a listed path, further segments keep their English name in both
 * languages: `/tools/images/weapons` is `/de/web-tools/images/weapons`.
 * Only what is listed here gets translated.
 */

export interface RouteDef {
  /** Folder below `app/[lang]/`, `[name]` marks a dynamic segment. */
  internal: string
  /** Public path per language, without the language prefix. */
  public: Record<Lang, string>
}

function route(internal: string, de: string = internal): RouteDef {
  return { internal, public: { en: internal, de } }
}

export const ROUTES: readonly RouteDef[] = [
  route('/'),

  route('/fivem'),
  route('/fivem/[id]'),
  route('/fivem/free',            '/fivem/kostenlos'),
  route('/fivem/all-access',      '/fivem/alle-scripts'),
  route('/fivem/categories/[id]'),

  route('/discord'),
  route('/discord/ticket-bot'),
  route('/discord/ticket-bot/compare'),
  route('/discord/ticket-bot/stats'),
  route('/discord/giveaway-bot'),
  route('/discord/giveaway-bot/stats'),
  route('/discord/giveaway-bot/g/[token]'),

  route('/tools',                           '/web-tools'),
  route('/tools/images',                    '/web-tools/images'),
  route('/tools/images/upload',             '/web-tools/images/upload'),
  route('/tools/images/[category]',         '/web-tools/images/[category]'),
  route('/tools/images/[category]/[name]',  '/web-tools/images/[category]/[name]'),

  route('/about',    '/ueber-msk'),
  route('/stats',    '/statistiken'),
  route('/cart',     '/warenkorb'),
  route('/checkout', '/kasse'),
  route('/account',  '/konto'),
  route('/login',    '/anmelden'),
  route('/report',   '/inhalt-melden'),

  route('/legal/imprint',    '/rechtliches/impressum'),
  route('/legal/privacy',    '/rechtliches/datenschutz'),
  route('/legal/terms',      '/rechtliches/agb'),
  route('/legal/withdrawal', '/rechtliches/widerrufsbelehrung'),
  route('/legal/dpa',        '/rechtliches/avv'),

  route('/withdraw-contract', '/vertrag-widerrufen'),
  route('/cancel-contract',   '/vertrag-kuendigen'),

  // Behind a login and disallowed in robots.txt: English in both languages,
  // the plan keeps them out of the translated table on purpose.
  route('/dashboard/ticket-bot'),
  route('/dashboard/ticket-bot/verify'),
  route('/dashboard/giveaway-bot'),
  route('/dashboard/giveaway-bot/verify'),
  route('/admin'),
]

/**
 * Addresses of the app before the move to `/en` and `/de`, mapped to their
 * internal path today. A prefix entry also covers everything below it, an
 * `exact` one only itself.
 *
 * The last five are older still: they used to live in `next.config.js`
 * (`/package/:id` was the singular scheme, the top-level ticket bot pages
 * moved under `/ticketbot` on 06.06.2026). Search Console still knew them.
 */
export const LEGACY_ROUTES: ReadonlyArray<{ from: string; to: string; exact?: boolean }> = [
  { from: '/packages',            to: '/fivem' },
  { from: '/categories',          to: '/fivem/categories' },
  { from: '/resources',           to: '/stats' },
  { from: '/images',              to: '/tools/images' },
  { from: '/terms',               to: '/legal/terms' },
  { from: '/terms/imprint',       to: '/legal/imprint' },
  { from: '/terms/privacy',       to: '/legal/privacy' },
  { from: '/terms/widerruf',      to: '/legal/withdrawal' },
  { from: '/terms/avv',           to: '/legal/dpa' },
  { from: '/vertrag-widerrufen',  to: '/withdraw-contract' },
  { from: '/vertrag-kuendigen',   to: '/cancel-contract' },
  { from: '/ticketbot',           to: '/discord/ticket-bot' },
  { from: '/ticketbot/dashboard', to: '/dashboard/ticket-bot' },
  { from: '/ticketbot/verify',    to: '/dashboard/ticket-bot/verify' },
  { from: '/giveaway',            to: '/discord/giveaway-bot' },
  { from: '/giveaway/dashboard',  to: '/dashboard/giveaway-bot' },
  { from: '/giveaway/verify',     to: '/dashboard/giveaway-bot/verify' },

  { from: '/package',   to: '/fivem' },
  { from: '/category',  to: '/fivem/categories' },
  { from: '/verify',    to: '/dashboard/ticket-bot/verify', exact: true },
  { from: '/dashboard', to: '/dashboard/ticket-bot',        exact: true },
  { from: '/stats',     to: '/discord/ticket-bot/stats',    exact: true },
]

// ─── Addresses without a language ────────────────────────────────────────────

/**
 * Addresses that exist exactly once per site and never get a language
 * prefix or a redirect.
 *
 * Either a file that is only read at the root (robots.txt, the sitemaps), or a
 * path an outside service calls and that therefore must never move: the API
 * with all OAuth callbacks and the Stripe webhook, the Tebex Discord return
 * (`/auth/discord`), the bot dashboard proxy, and the transcripts Apache
 * serves from disk. A prefix in front of one of them is not a translation but
 * a second name for the same thing, so `/de/sitemap.xml` stays a 404.
 *
 * The path is checked without a language prefix.
 */
export function isExemptPath(path: string): boolean {
  return EXEMPT_EXACT.has(path)
    || EXEMPT_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
}

/** Files with exactly this name and nothing below them. */
const EXEMPT_EXACT = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-images.xml',
  '/sitemap.xsl',
  '/llms.txt',
  '/favicon.ico',
  '/logo.png',
])

/** Whole branches: the address itself and everything below it. */
const EXEMPT_PREFIXES = [
  '/api',
  '/_next',
  '/auth',
  '/botproxy',
  '/transcripts',
]

// ─── Path matching ───────────────────────────────────────────────────────────

type Side = 'internal' | Lang

function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']')
}

/**
 * Pattern order: at the first segment where two patterns differ, a static
 * segment beats a dynamic one (as in Next's own routing, `/fivem/free` before
 * `/fivem/[id]`); if one pattern is the start of the other, the longer one
 * comes first.
 */
function comparePatterns(a: string[], b: string[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const da = isDynamic(a[i])
    const db = isDynamic(b[i])
    if (da !== db) return da ? 1 : -1
  }
  return b.length - a.length
}

const ORDERED: Record<Side, Array<{ route: RouteDef; pattern: string[] }>> = (() => {
  const sides: Side[] = ['internal', ...LANGS]
  const out = {} as Record<Side, Array<{ route: RouteDef; pattern: string[] }>>
  for (const side of sides) {
    out[side] = ROUTES
      .map(r => ({ route: r, pattern: segments(side === 'internal' ? r.internal : r.public[side]) }))
      .sort((x, y) => comparePatterns(x.pattern, y.pattern))
  }
  return out
})()

/** Values of the dynamic segments, or null if the pattern is not a prefix of the path. */
function matchPrefix(pattern: string[], path: string[]): Record<string, string> | null {
  // The root pattern has no segments and would be a prefix of everything.
  if (pattern.length === 0) return path.length === 0 ? {} : null
  if (path.length < pattern.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pattern.length; i++) {
    if (isDynamic(pattern[i])) params[pattern[i]] = path[i]
    else if (pattern[i] !== path[i]) return null
  }
  return params
}

function fill(pattern: string[], params: Record<string, string>): string[] {
  return pattern.map(s => (isDynamic(s) ? params[s] : s))
}

function join(segs: string[]): string {
  return `/${segs.join('/')}`
}

/** Translates a lang-less path from one side of the table to the other. */
function translate(path: string, from: Side, to: Side): string | null {
  const segs = segments(path)
  for (const { route: r, pattern } of ORDERED[from]) {
    const params = matchPrefix(pattern, segs)
    if (!params) continue
    const target = segments(to === 'internal' ? r.internal : r.public[to])
    const out = join([...fill(target, params), ...segs.slice(pattern.length)])
    // A trailing slash is meaningful in robots.txt (`/dashboard/` blocks the
    // branch, not the word), so it survives the translation.
    return out !== '/' && path.endsWith('/') ? `${out}/` : out
  }
  return null
}

/** Splits `?query` and `#hash` off, so only the path itself is translated. */
function splitSuffix(href: string): [string, string] {
  const cut = href.search(/[?#]/)
  return cut === -1 ? [href, ''] : [href.slice(0, cut), href.slice(cut)]
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * The public address of an internal path in one language, with prefix:
 * `publicPath('de', '/legal/terms')` is `/de/rechtliches/agb`. A query string
 * or hash is kept. A path the table does not know keeps its segments.
 */
export function publicPath(lang: Lang, internal: string): string {
  const [path, suffix] = splitSuffix(internal.startsWith('/') ? internal : `/${internal}`)
  const rest = translate(path, 'internal', lang) ?? path
  return `${rest === '/' ? `/${lang}` : `/${lang}${rest}`}${suffix}`
}

/**
 * The internal path behind a public path of one language (without the
 * prefix), or null if no table entry matches.
 */
export function internalPath(lang: Lang, publicRest: string): string | null {
  return translate(publicRest, lang, 'internal')
}

/** Both public versions of a page, for hreflang and the language switcher. */
export function alternatePaths(internal: string): Record<Lang, string> {
  return { en: publicPath('en', internal), de: publicPath('de', internal) }
}

/** hreflang `x-default`: the root, which picks a language and redirects. */
export const X_DEFAULT_PATH = '/'

/**
 * Splits `/de/...` and `/en/...` into language and the rest. Null for a
 * path without a language prefix. The whole segment counts: `/deals` has no
 * prefix.
 */
export function splitLangPrefix(pathname: string): { lang: Lang; rest: string } | null {
  const first = segments(pathname)[0]
  if (!isLang(first)) return null
  const rest = pathname.slice(first.length + 1)
  return { lang: first, rest: rest === '' ? '/' : rest }
}

/**
 * Maps an address of the old app (without language prefix) to its internal
 * path today, or null if it is not one.
 */
export function legacyTarget(path: string): string | null {
  let best: { from: string; to: string } | null = null
  for (const entry of LEGACY_ROUTES) {
    const hit = entry.exact
      ? path === entry.from
      : path === entry.from || path.startsWith(`${entry.from}/`)
    if (hit && (!best || entry.from.length > best.from.length)) best = entry
  }
  if (!best) return null
  return `${best.to}${path.slice(best.from.length)}`
}

/**
 * The internal path for the rest of a prefixed address, in the order the
 * proxy accepts them: the form of this language, the form of the other
 * language, an old address. The caller compares the canonical form and
 * redirects if the visitor used any other.
 */
function resolveInternal(lang: Lang, rest: string): string | null {
  const other = LANGS.find(l => l !== lang) ?? DEFAULT_LANG
  return internalPath(lang, rest) ?? internalPath(other, rest) ?? legacyTarget(rest)
}

/**
 * Language and internal path of an address as the browser shows it. Never
 * fails: an address without a prefix counts as English, an unknown rest is
 * returned as it is. For the client, where `usePathname()` is the source.
 */
export function parsePublicPath(pathname: string): { lang: Lang; path: string } {
  const prefixed = splitLangPrefix(pathname)
  if (!prefixed) return { lang: DEFAULT_LANG, path: pathname || '/' }
  return { lang: prefixed.lang, path: resolveInternal(prefixed.lang, prefixed.rest) ?? prefixed.rest }
}

// ─── Root redirect ───────────────────────────────────────────────────────────

/** Cookie that remembers the language version a visitor used last. */
export const LANG_COOKIE = 'msk_lang'

/**
 * The language `/` sends a visitor to: the remembered one, then the first
 * supported language in `Accept-Language` by weight, else English.
 */
export function chooseRootLang(input: { cookie?: string | null; acceptLanguage?: string | null }): Lang {
  if (isLang(input.cookie)) return input.cookie
  return langFromAcceptLanguage(input.acceptLanguage) ?? DEFAULT_LANG
}

/** First supported language in an `Accept-Language` header, by q-value. */
export function langFromAcceptLanguage(header: string | null | undefined): Lang | null {
  if (!header) return null
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map(p => p.trim()).find(p => p.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return { primary: tag.trim().toLowerCase().split('-')[0], weight: Number.isFinite(weight) ? weight : 0, index }
    })
    .filter(e => e.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
  const hit = ranked.find(e => isLang(e.primary))
  return hit ? (hit.primary as Lang) : null
}

// ─── What the proxy does with a request ──────────────────────────────────────

export type Resolution =
  /** Hand to Next unchanged: exempt address or a static file. */
  | { kind: 'pass' }
  /** `location` is a path; the proxy appends the query string. */
  | { kind: 'redirect'; status: 307 | 308; location: string }
  /**
   * Render a page. `path` is the internal path (basis for canonical and
   * hreflang), `target` the address Next routes (`/de/legal/terms`).
   */
  | { kind: 'page'; lang: Lang; path: string; target: string }

function targetOf(lang: Lang, internal: string): string {
  return internal === '/' ? `/${lang}` : `/${lang}${internal}`
}

/** A last segment with a dot is a file in `public/`, not a page. */
function looksLikeFile(path: string): boolean {
  const last = segments(path).pop() ?? ''
  return last.includes('.')
}

/**
 * Decides what the proxy does with a path. Pure, so the whole routing policy
 * is testable without Next:
 *
 *   - `/` answers 307 to `/de` or `/en` (see `chooseRootLang`),
 *   - every page has exactly one address per language; any other known form
 *     (the other language's words, an old address) answers 308 to it,
 *   - exempt addresses are never prefixed or redirected,
 *   - an unknown address is rendered by the 404 page of its language.
 */
export function resolveRequest(
  pathname: string,
  ctx: { cookie?: string | null; acceptLanguage?: string | null } = {},
): Resolution {
  if (pathname === '/') {
    return { kind: 'redirect', status: 307, location: publicPath(chooseRootLang(ctx), '/') }
  }

  const prefixed = splitLangPrefix(pathname)

  if (!prefixed) {
    if (isExemptPath(pathname)) return { kind: 'pass' }
    // Old addresses first: `/stats` meant the ticket bot statistics long
    // before `/en/stats` existed, and links to it are still out there.
    const internal = legacyTarget(pathname) ?? internalPath(DEFAULT_LANG, pathname)
    if (internal !== null) {
      return { kind: 'redirect', status: 308, location: publicPath(DEFAULT_LANG, internal) }
    }
    if (looksLikeFile(pathname)) return { kind: 'pass' }
    return { kind: 'page', lang: DEFAULT_LANG, path: pathname, target: targetOf(DEFAULT_LANG, pathname) }
  }

  const { lang, rest } = prefixed

  // `/de/api/...` is not a page, and not a reason to redirect either.
  if (isExemptPath(rest)) {
    return { kind: 'page', lang, path: rest, target: pathname }
  }

  const internal = resolveInternal(lang, rest)
  if (internal === null) {
    return { kind: 'page', lang, path: rest, target: pathname }
  }

  const canonical = publicPath(lang, internal)
  if (canonical !== pathname) return { kind: 'redirect', status: 308, location: canonical }

  return { kind: 'page', lang, path: internal, target: targetOf(lang, internal) }
}

/**
 * Pages of the Discord bots rather than the FiveM shop: landings, stats,
 * result pages and dashboards. Header and footer address another audience
 * there.
 */
export function isBotPath(internal: string): boolean {
  return ['/discord', '/dashboard'].some(p => internal === p || internal.startsWith(`${p}/`))
}
