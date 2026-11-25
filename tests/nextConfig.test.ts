import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const nextConfig = require('../next.config.js')

/**
 * Crawl of 25.11.2026: a streamed canonical and robots tag landed after
 * </head> for user agents not on Next's bot list, and the build assets went
 * out without the security headers the proxy sets for documents.
 */
describe('next.config.js', () => {
  it('blocks on metadata for every user agent', () => {
    const bots: RegExp = nextConfig.htmlLimitedBots
    for (const ua of ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142.0', 'OpenSpider/1.0', '']) {
      expect(bots.test(ua)).toBe(true)
    }
  })

  it('sends the security headers with static files and optimised images', async () => {
    const rules: { source: string; headers: { key: string; value: string }[] }[] = await nextConfig.headers()
    for (const source of ['/_next/static/:path*', '/_next/image']) {
      const keys = rules.find(r => r.source === source)?.headers.map(h => h.key) ?? []
      expect(keys, source).toEqual(expect.arrayContaining([
        'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy',
      ]))
    }
    const staticKeys = rules.find(r => r.source === '/_next/static/:path*')?.headers.map(h => h.key)
    expect(staticKeys).toContain('Content-Security-Policy')
  })
})
