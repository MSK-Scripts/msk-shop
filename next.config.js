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
}

module.exports = nextConfig
