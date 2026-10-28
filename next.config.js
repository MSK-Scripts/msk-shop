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
