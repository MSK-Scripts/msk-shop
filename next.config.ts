import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.tebex.io' },
      { protocol: 'https', hostname: '**.tebex.io' },
      { protocol: 'https', hostname: 'dunb17ur4ymx4.cloudfront.net' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'assets-global.website-files.com' },
    ],
  },
  async headers() {
    // Hier definieren wir die CSP-Regeln
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline' fonts.googleapis.com;
      img-src 'self' blob: data: cdn.tebex.io *.tebex.io dunb17ur4ymx4.cloudfront.net *.cloudfront.net *.msk-scripts.de;
      font-src 'self' data: fonts.gstatic.com;
      connect-src 'self' ws: wss: https:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ]
  },
}

export default nextConfig