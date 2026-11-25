/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.tebex.io' },
      { protocol: 'https', hostname: '**.tebex.io' },
      { protocol: 'https', hostname: 'dunb17ur4ymx4.cloudfront.net' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'assets-global.website-files.com' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
    ],
  },
  // Security-Header werden zentral in proxy.ts gesetzt, damit die
  // Nonce-basierte CSP funktioniert und keine doppelten Header entstehen.
  // Siehe proxy.ts für alle gesetzten Header.
  poweredByHeader: false,

  /*
   * Metadata is resolved before the head is sent, for every user agent. Since
   * 15.2 Next streams it for browsers and only blocks for the bots in its own
   * list. A streamed canonical or robots tag that resolves after the shell
   * lands in the body: measured on 25.11.2026, two of six requests for
   * /de/web-tools/bilder/props carried both after </head>, and a crawler that
   * is not on the list reads them as missing. One regex for all is the switch
   * the docs give for turning streaming off.
   */
  htmlLimitedBots: /.*/,

  /*
   * The proxy sets the security headers for every document but does not run
   * for build assets (see the matcher in proxy.ts), so scripts, styles, fonts
   * and optimised images left without them. Same values as in proxy.ts. The
   * image optimiser keeps the CSP it sets itself, the static files get a
   * policy that allows nothing, since they are no documents.
   */
  async headers() {
    const base = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options',    value: 'nosniff' },
      { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
    ]
    return [
      {
        source:  '/_next/static/:path*',
        headers: [...base, { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'self'" }],
      },
      { source: '/_next/image', headers: base },
    ]
  },

  /*
   * Hier stand bis Next 16 ein `eslint: { ignoreDuringBuilds: true }`, damit der
   * Build nicht ein zweites Mal lintet und das Deploy-Log mit Warnungen flutet.
   * Next 16 kennt den Schlüssel nicht mehr und lintet im Build grundsätzlich
   * nicht, das gewünschte Verhalten ist also jetzt der Standard.
   *
   * Gelintet wird weiterhin im CI-Job „Lint" und lokal über `npm run lint`, das
   * seit Next 16 die ESLint-CLI direkt aufruft statt des entfallenen
   * `next lint`. Der Deploy hängt per `workflow_run` an der grünen CI, das Gate
   * sitzt also ohnehin vor dem Build und nicht darin.
   */

  /*
   * The redirects for old addresses (`/package/:id`, `/category/:id`,
   * `/verify`, `/dashboard`, `/stats`) lived here until the redesign of
   * 27.10.2026. They are in `LEGACY_ROUTES` (lib/routes.ts) now, with every
   * other old address: from there they reach the new address with its
   * language in one hop instead of pointing at a second old one, and a test
   * checks each of them.
   */
}

module.exports = nextConfig
