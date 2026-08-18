import { NextRequest, NextResponse } from 'next/server'

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

// Greift die ERSTE passende Regel (Reihenfolge = Priorität). NUR echte
// Public-Flächen — die bot-authentifizierten /api/giveaway-result/* Routen
// werden bewusst NICHT IP-limitiert (der Bot ruft sie als einzelne Server-IP
// auf; ein IP-Limit würde ihn bei vielen gleichzeitig endenden Giveaways selbst
// aussperren — Schutz dort übernimmt der Bearer-Secret + das Body-Limit).
const RATE_RULES: RateRule[] = [
  { prefix: '/api/giveaway/auth', limit: 10, windowMs: 5 * 60_000 }, // OAuth-Spam bremsen
  { prefix: '/giveaway/g/',       limit: 60, windowMs: 60_000 },     // öffentliche Ergebnis-Seiten
]

// Explizites Body-Limit (Content-Length) für Giveaway-POST/-Mutationsrouten.
const MAX_BODY_BYTES = 64 * 1024
const BODY_LIMIT_PREFIXES = ['/api/giveaway/', '/api/giveaway-result/']

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
  if (request.method !== 'GET' && request.method !== 'HEAD' &&
      BODY_LIMIT_PREFIXES.some((p) => pathname.startsWith(p))) {
    const len = Number(request.headers.get('content-length') ?? '0')
    if (Number.isFinite(len) && len > MAX_BODY_BYTES) {
      return new NextResponse('Payload Too Large', {
        status: 413,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  }

  // ── Rate-Limiting (pro IP, pro Routen-Präfix) ───────────────────────────────
  const rule = RATE_RULES.find((r) => pathname.startsWith(r.prefix))
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

  // Web-Crypto-API ist im Edge-Runtime verfügbar (Buffer nicht)
  const nonceBytes = new Uint8Array(16)
  crypto.getRandomValues(nonceBytes)
  const nonce = btoa(String.fromCharCode(...nonceBytes))

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
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  // Server Components sehen den Pfad sonst nicht. Das Root-Layout braucht ihn,
  // um auf den fest deutschen /de/-Routen `<html lang>` und die Chrome-Sprache
  // an den Seiteninhalt anzugleichen, statt dem msk_lang-Cookie zu folgen.
  requestHeaders.set('x-pathname', pathname)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Response-Header — diese werden tatsächlich an den Browser geliefert.
  response.headers.set('Content-Security-Policy', csp)
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
// Prefetch-Requests werden ausgeschlossen, damit der Nonce nicht gecacht wird.
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
      source: '/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|api/transcript/upload).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
