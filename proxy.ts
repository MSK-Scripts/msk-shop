import { NextRequest, NextResponse } from 'next/server'

import { DEFAULT_LANG, LANG_HEADER, NOT_FOUND_HEADER, PATH_HEADER } from '@/lib/lang'
import { LANG_COOKIE, resolveRequest } from '@/lib/routes'

// Diese Datei hieß bis Next 16 `middleware.ts`. Next 16 hat die Konvention in
// `proxy.ts` umbenannt (die alte warnt beim Build und entfällt später), die
// exportierte Funktion heißt entsprechend `proxy` statt `middleware`. Inhaltlich
// ist nichts anders: dasselbe Matching, dieselben Header, derselbe Nonce.

// =============================================================================
// Rate-Limiting + Body-Limit (In-Memory, Fixed-Window)
// =============================================================================
// msk-shop läuft self-hosted als EIN Node-Prozess (systemd `next start`), daher
// persistiert dieser Modul-State zuverlässig über Requests hinweg. Bei mehreren
// Workern/Instanzen gilt das Limit pro Worker (akzeptable Degradierung).
//
// Client-IP kommt hinter Apache via X-Forwarded-For (mod_proxy setzt den Header).

interface RateRule { prefix: string; limit: number; windowMs: number }

// Page rules match the internal path without language (`/tools/images`),
// not the address: `/en/tools/images` and `/de/web-tools/images` are the same
// page and share one bucket. API paths have no language and stay as they are.
//
// Greift die ERSTE passende Regel (Reihenfolge = Priorität). NUR echte
// Public-Flächen — die bot-authentifizierten /api/giveaway-result/* Routen
// werden bewusst NICHT IP-limitiert (der Bot ruft sie als einzelne Server-IP
// auf; ein IP-Limit würde ihn bei vielen gleichzeitig endenden Giveaways selbst
// aussperren — Schutz dort übernimmt der Bearer-Secret + das Body-Limit).
const RATE_RULES: RateRule[] = [
  { prefix: '/api/giveaway/auth', limit: 10,  windowMs: 5 * 60_000 }, // OAuth-Spam bremsen
  { prefix: '/discord/giveaway-bot/g/', limit: 60, windowMs: 60_000 }, // public result pages
  // Bildergalerie: das Blättern wird gedeckelt, die Bilder selbst nicht. Die
  // liegen auf cdn.msk-scripts.de und laufen gar nicht durch diesen Prozess —
  // sie müssen offen bleiben, sonst kann ein FiveM-NUI sie nicht laden.
  // Gedeckelt wird also genau der teure Teil: wer den Bestand durchpaginieren
  // will, braucht pro Seite eine Datenbankabfrage. 120 pro Minute trifft im
  // Normalbetrieb niemanden, eine Suche löst höchstens eine Anfrage aus.
  // (`/images` is `/tools/images` since the redesign.)
  // Die 120 auf `/images` waren zu eng und haben am 25.08.2026 einen normalen
  // Besucher ausgesperrt: das Raster zeigt 60 Kacheln, und Next holte fuer
  // jede sichtbare die Detailseite vor. Zwei Seitenaufrufe rissen das Limit,
  // ohne dass jemand etwas Ungewoehnliches getan haette.
  //
  // Behoben ist die Ursache (die Kacheln prefetchen nicht mehr, siehe
  // components/images/ImageCard.tsx). Die Zahl hier steigt trotzdem, weil ein
  // Limit, das beim bestimmungsgemaessen Blaettern greift, kein Schutz ist,
  // sondern ein Defekt. 600 reicht immer noch, um einen Scraper zu bremsen,
  // der den Bestand seitenweise durchgeht.
  //
  // Die beiden Upload-Regeln stehen VOR '/api/images', weil `find` den ersten
  // passenden Präfix nimmt und '/api/images/upload' sonst unter den 300 des
  // Blätterns liefe. Ein Upload kostet eine sharp-Dekodierung fremder Bytes,
  // das ist die teuerste Anfrage der ganzen Anwendung und gehört enger
  // gedeckelt als eine Datenbankabfrage. Das eigentliche Limit pro Person ist
  // ohnehin ein anderes (UPLOADS_PER_DAY in lib/imageUploads.ts) — dieses hier
  // bremst nur den, der es ohne Sitzung mit Masse versucht.
  { prefix: '/api/images/upload/auth', limit: 10,  windowMs: 5 * 60_000 },
  { prefix: '/api/images/upload',      limit: 20,  windowMs: 60_000 },
  { prefix: '/api/images',        limit: 300, windowMs: 60_000 },
  { prefix: '/tools/images',      limit: 600, windowMs: 60_000 },
  // Die drei Pflichtformulare (§ 356a BGB, § 312k BGB, Art. 16 DSA). Jede
  // Absendung schreibt eine Zeile und verschickt zwei Mails, das gehört
  // gedeckelt. Die Zahl ist aber bewusst hoch genug, dass sie niemanden
  // trifft, der es ernst meint: eine Widerrufserklärung, die an einem
  // Rate-Limit scheitert, wäre genau die Erschwerung, die § 356a verbietet.
  // Wer sich vertippt und es dreimal versucht, kommt durch.
  //
  // 20 statt der zunaechst gesetzten 10: alle drei Formulare teilen sich diesen
  // Eimer, und hinter einer NAT sitzen mehrere Personen auf derselben Adresse.
  // Ein 429 sperrt die Widerrufsfunktion fuer zehn Minuten — das ist teurer als
  // die zehn zusaetzlichen Anfragen, die ein Angreifer damit gewinnt, zumal
  // jede Absendung nur eine Zeile schreibt und zwei Mails ausloest.
  { prefix: '/api/legal/',        limit: 20,  windowMs: 10 * 60_000 },
]

// Explizite Body-Limits (Content-Length) je Routenpräfix.
//
// Bis zum 26.08.2026 war das eine Liste mit einer gemeinsamen Obergrenze von
// 64 KB. Der Bild-Upload braucht mehr, und ihm die 64 KB zu geben hätte
// bedeutet, entweder alle Grenzen anzuheben oder ihn ganz auszunehmen. Beides
// wäre schlechter als eine Zahl pro Präfix: die Giveaway-Routen bleiben so
// eng wie bisher, und der Upload hat genau die Grenze, die
// lib/imageUploads.ts ein zweites Mal prüft.
//
// Die Längste zuerst, aus demselben Grund wie oben bei den Rate-Regeln.
const BODY_LIMITS: Array<{ prefix: string; maxBytes: number }> = [
  { prefix: '/api/images/upload',    maxBytes: 8 * 1024 * 1024 },
  { prefix: '/api/giveaway/',        maxBytes: 64 * 1024 },
  { prefix: '/api/giveaway-result/', maxBytes: 64 * 1024 },
  // Reiner Text. 64 KB reichen für eine ausführliche DSA-Begründung um ein
  // Vielfaches; `lib/legalForms.ts` schneidet pro Feld noch einmal ab.
  { prefix: '/api/legal/',           maxBytes: 64 * 1024 },
]

interface Bucket { count: number; reset: number }
const buckets = new Map<string, Bucket>()
let lastSweep = 0

function clientIp(request: NextRequest): string {
  // X-Forwarded-For is a chain where each proxy appends the address it saw.
  // Behind our single trusted proxy (Apache) the RIGHTMOST entry is the real
  // client; the leftmost entries are client-supplied and spoofable, so keying
  // the rate limiter on them would let an attacker reset their bucket at will.
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

/** true = Limit überschritten (blockieren). */
function isRateLimited(key: string, limit: number, windowMs: number, now: number): boolean {
  const b = buckets.get(key)
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return false
  }
  if (b.count >= limit) return true
  b.count++
  return false
}

/** Abgelaufene Buckets gelegentlich entfernen (kein setInterval im Edge-Runtime). */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k)
}

// =============================================================================
// Security-Proxy — Nonce-basierte Content Security Policy
// =============================================================================
// Generiert pro Request einen kryptographisch sicheren Nonce, härtet das CSP
// (kein 'unsafe-inline'/'unsafe-eval' mehr in script-src) und setzt zusätzlich
// alle weiteren Security-Header zentral hier, damit der Apache-vhost nichts
// doppelt schicken muss.
//
// Next.js 15 hängt den Nonce automatisch an seine internen <script>-Tags, wenn
// er im `x-nonce` Request-Header steht UND im Response-`Content-Security-Policy`
// eine Nonce-Direktive enthalten ist.
// =============================================================================

// The dedicated host the hosted bot dashboards are proxied under. Requests to it
// are handed to the /_botproxy route, which forwards them to the bot's loopback
// port. Crucially this happens BEFORE the msk-shop CSP/security headers below:
// the proxied responses carry the BOT's own CSP and headers, and wrapping them in
// msk-shop's strict nonce CSP would break the bot's app.
const BOT_DASHBOARD_HOST = (process.env.BOT_DASHBOARD_HOST || 'bot-dashboard.msk-scripts.de').toLowerCase()

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const now = Date.now()

  // ── Bot-dashboard proxy host: rewrite every path to the proxy route ─────────
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0]
  if (host === BOT_DASHBOARD_HOST) {
    const url = request.nextUrl.clone()
    const requestHeaders = new Headers(request.headers)
    // Carry the real path across the rewrite; the query string stays on the URL.
    // NOTE: the target folder must NOT start with '_' — App Router treats an
    // underscore-prefixed folder as a private folder and excludes it from routing.
    requestHeaders.set('x-proxy-path', url.pathname)
    url.pathname = '/botproxy'
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  sweep(now)

  // ── Body-Limit: übergroße Mutations-Requests früh abweisen ──────────────────
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const limit = BODY_LIMITS.find((b) => pathname.startsWith(b.prefix))
    const len   = Number(request.headers.get('content-length') ?? '0')
    if (limit && Number.isFinite(len) && len > limit.maxBytes) {
      return new NextResponse('Payload Too Large', {
        status: 413,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  }

  // ── Language and address: what happens to this request ──────────────────────
  // The whole policy lives in `resolveRequest` (lib/routes.ts) and is tested
  // there: `/` redirects by cookie and Accept-Language, every page has exactly
  // one address per language, and every other known form (an old address, the
  // English words under /de) gets a 308 to it.
  const resolution = resolveRequest(pathname, {
    cookie:         request.cookies.get(LANG_COOKIE)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  })

  // ── Rate-Limiting (pro IP, pro Routen-Präfix) ───────────────────────────────
  const ratePath = resolution.kind === 'page' ? resolution.path : pathname
  const rule = RATE_RULES.find((r) => ratePath.startsWith(r.prefix))
  if (rule) {
    const key = `${rule.prefix}:${clientIp(request)}`
    if (isRateLimited(key, rule.limit, rule.windowMs, now)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': String(Math.ceil(rule.windowMs / 1000)),
        },
      })
    }
  }

  // Vorgeholte Anfragen bekommen keinen Nonce: er gehört zu genau dem
  // Dokument, das ihn ausgeliefert hat, und eine Payload, die der Browser für
  // später weghängt, landet später in einem anderen.
  //
  // Was hier NICHT erkennbar ist, und das ist der Grund für den Fehler vom
  // 23.08.2026: Next entfernt seine eigenen Routing-Header (`RSC`,
  // `next-router-prefetch`) **bevor** der Proxy den Request sieht. Nachgemessen
  // sieht er nur accept, host, user-agent und die x-forwarded-*. Der einzige
  // Ort, an dem sich Nexts Prefetch abfangen liess, war deshalb der Matcher —
  // und genau der Ausschluss dort hat den Sprach-Rewrite mit ausgeschaltet.
  // `/de/<pfad>` existiert ohne Rewrite als Route gar nicht, jeder <Link> auf
  // eine deutsche Adresse holte sich also einen 404 in den Router-Cache, und
  // der Klick darauf lieferte einen leeren Baum: die Adresse wechselte, der
  // Inhalt blieb englisch.
  //
  // Nexts eigene Prefetches tragen seither einen Nonce, und das ist hier
  // unschädlich, nachgemessen statt angenommen: `script-src` hat
  // `'strict-dynamic'`, damit zählt bei nachträglich eingehängten Scripts die
  // Herkunft und nicht der Nonce. Und `style-src` hätte kein
  // `'strict-dynamic'`, aber das ausgelieferte Dokument enthält **null**
  // inline `<style>`-Tags: die Schriften kommen über @fontsource-variable als
  // normales Stylesheet, `next/font` benutzt das Projekt nicht.
  //
  // Die Header der Browser-Ebene sind dagegen sichtbar und werden genutzt.
  const isPrefetch = request.headers.get('purpose') === 'prefetch'
    || request.headers.get('sec-purpose')?.includes('prefetch') === true

  // Web-Crypto-API ist im Edge-Runtime verfügbar (Buffer nicht)
  let nonce = ''
  if (!isPrefetch) {
    const nonceBytes = new Uint8Array(16)
    crypto.getRandomValues(nonceBytes)
    nonce = btoa(String.fromCharCode(...nonceBytes))
  }

  const csp = [
    // 'none' = deny-by-default. Jede genutzte Resource-Kategorie muss explizit
    // aufgeführt sein. Mozilla Observatory: "Deny by default" → ✓
    `default-src 'none'`,
    // 'strict-dynamic' erlaubt mit dem Nonce geladene Scripts, ALL anderen
    // werden blockiert. Damit fällt 'unsafe-inline' & 'unsafe-eval' weg.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Next.js hängt den Nonce automatisch an seine inline <style>-Tags
    // (next/font, Critical CSS). Damit fällt 'unsafe-inline' für style-src weg.
    `style-src 'self' 'nonce-${nonce}'`,
    // style-src-attr deckt `style="..."`-Attribute (React inline styles) ab.
    // Mozilla Observatory wertet nur style-src, nicht style-src-attr.
    `style-src-attr 'unsafe-inline'`,
    `img-src 'self' blob: data: cdn.tebex.io *.tebex.io dunb17ur4ymx4.cloudfront.net *.cloudfront.net *.msk-scripts.de cdn.discordapp.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://headless.tebex.io https://ident.tebex.io https://discord.com`,
    // Next.js verwendet blob:-Worker für sein Streaming-Hydration-System
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  // Nonce über Request-Header an Next.js durchreichen → Next.js setzt ihn
  // automatisch auf seine internen Hydration-Scripts.
  const requestHeaders = new Headers(request.headers)
  if (nonce) {
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', csp)
  }
  // Only this proxy decides that an address is unknown, never the client.
  requestHeaders.delete(NOT_FOUND_HEADER)

  // The language is in the path: every page lives under /en/ or /de/. The
  // German address (`/de/rechtliches/agb`) is rewritten onto the folder
  // (`/de/legal/terms`); the English one already is the folder. Language and
  // internal path go to the Server Components as headers; the internal path is
  // the basis for canonical, hreflang and the language switcher.
  //
  // An address that exists only once (API, sitemap, OAuth callback) passes
  // through untouched. With a prefix in front (`/de/sitemap.xml`) it is not a
  // translation but a second name for the same file, and gets the 404 it
  // deserves.
  let response: NextResponse
  if (resolution.kind === 'redirect') {
    const target = new URL(`${resolution.location}${request.nextUrl.search}`, request.url)
    response = NextResponse.redirect(target, resolution.status)
    // `/` answers differently depending on the cookie and the browser language.
    if (resolution.status === 307) response.headers.set('Vary', 'Cookie, Accept-Language')
  } else if (resolution.kind === 'pass') {
    requestHeaders.set(LANG_HEADER, DEFAULT_LANG)
    requestHeaders.set(PATH_HEADER, pathname)
    response = NextResponse.next({ request: { headers: requestHeaders } })
  } else if (resolution.unknown) {
    // An address the route table does not know. It is rendered by the
    // catch-all `app/[lang]/[...rest]`, which shows the 404 page inside the
    // shop layout when this header is set. The status comes from here: a
    // thrown `notFound()` would give the right status too, but Next answers
    // it with an empty error shell without `lang` and renders the page only
    // in the browser (WCAG 3.1.1, and nothing for a crawler to read).
    requestHeaders.set(LANG_HEADER, resolution.lang)
    requestHeaders.set(PATH_HEADER, resolution.path)
    requestHeaders.set(NOT_FOUND_HEADER, '1')
    response = NextResponse.rewrite(
      new URL(`${resolution.target}${request.nextUrl.search}`, request.url),
      { request: { headers: requestHeaders }, status: 404 },
    )
  } else {
    requestHeaders.set(LANG_HEADER, resolution.lang)
    requestHeaders.set(PATH_HEADER, resolution.path)
    response = resolution.target === pathname
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : NextResponse.rewrite(
          new URL(`${resolution.target}${request.nextUrl.search}`, request.url),
          { request: { headers: requestHeaders } },
        )
    // No language cookie is set here. The language is in the address, and
    // `msk_lang` is only written by the language switcher when a visitor
    // chooses a language (components/i18n/LanguageDropdown.tsx). The privacy
    // policy promises exactly that; tests/routes.test.ts guards it.
  }

  // Response-Header — diese werden tatsächlich an den Browser geliefert.
  // Eine Prefetch-Antwort ist kein Dokument, sie trägt deshalb keine CSP:
  // durchgesetzt wird immer die des Dokuments, in dem die Payload landet.
  if (nonce) response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}

// Der Proxy läuft auf allen Routen außer statischen Assets — diese liefert
// Next.js bzw. Apache direkt aus und brauchen die Header-Pipeline nicht.
// Nexts Router-Prefetches laufen bewusst MIT durch, sonst greift der
// Sprach-Rewrite für sie nicht und `/de/<pfad>` prefetcht einen 404.
// (Still true with the translated paths: `/de/rechtliches/agb` exists as a
// route only after the rewrite onto `/de/legal/terms`.)
// Begründung und Messung stehen oben in `proxy()` beim Nonce.
//
// `api/transcript/upload` ist BEWUSST ausgenommen: läuft der Proxy auf einer
// Route, puffert Next.js 15 den Request-Body (Default 10 MB) und schneidet ihn
// darüber hinaus ab → bei Premium+-Uploads (großes Transkript + Anhänge) wird
// der JSON-Body abgeschnitten → "Invalid JSON body". Die Route ist eine
// Bot-API mit eigener API-Key-Auth + tier-basierten Größenlimits; CSP/Nonce
// sind für die JSON-Antwort irrelevant. Ohne Proxy kein Body-Limit.
export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|sitemap.xsl|api/transcript/upload).*)',
    },
  ],
}
