import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// Security Middleware — Nonce-basierte Content Security Policy
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

export function middleware(request: NextRequest) {
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
    `connect-src 'self' ws: wss: https://headless.tebex.io https://ident.tebex.io https://discord.com`,
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

// Middleware läuft auf allen Routen außer statischen Assets — diese liefert
// Next.js bzw. Apache direkt aus und brauchen die Header-Pipeline nicht.
// Prefetch-Requests werden ausgeschlossen, damit der Nonce nicht gecacht wird.
export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
