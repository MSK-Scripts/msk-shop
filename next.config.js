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
  // Security-Header werden zentral in middleware.ts gesetzt, damit die
  // Nonce-basierte CSP funktioniert und keine doppelten Header entstehen.
  // Siehe middleware.ts für alle gesetzten Header.
  poweredByHeader: false,

  /**
   * Permanente Redirects für Alt-URLs, die Google noch kennt und die aktuell
   * 404 liefern (nachgewiesen im Search-Console-Bericht „Nicht gefunden").
   *
   *  - `/package/:id`  und `/category/:id`: altes Singular-Schema
   *  - `/verify`, `/dashboard`, `/stats`:   vor dem Routen-Umbau vom 2026-06-06
   *                                         lagen die Ticket-Bot-Seiten auf der
   *                                         obersten Ebene (siehe CLAUDE.md)
   *
   * `permanent: true` ergibt 308, damit Google die Zielseite übernimmt und die
   * Alt-URL aus dem Index fällt.
   */
  async redirects() {
    return [
      { source: '/package/:id',  destination: '/packages/:id',   permanent: true },
      { source: '/category/:id', destination: '/categories/:id', permanent: true },
      { source: '/verify',       destination: '/ticketbot/verify',    permanent: true },
      { source: '/dashboard',    destination: '/ticketbot/dashboard', permanent: true },
      { source: '/stats',        destination: '/ticketbot/stats',     permanent: true },
    ]
  },
}

module.exports = nextConfig
