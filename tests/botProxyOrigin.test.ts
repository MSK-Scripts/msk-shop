import { describe, it, expect } from 'vitest'

import { isAllowedProxyOrigin, PROXY_HOST } from '@/lib/botDashboardProxy'

// The bot trusts the proxy and skips its own CSRF check for proxied requests,
// so a write from another origin has to be stopped here.
describe('bot dashboard proxy origin check', () => {
  const h = (init: Record<string, string>) => new Headers(init)
  const own = `https://${PROXY_HOST}`

  it('lets reading requests through without any origin', () => {
    for (const m of ['GET', 'HEAD', 'OPTIONS', 'get']) expect(isAllowedProxyOrigin(m, h({}))).toBe(true)
  })

  it('accepts a write from the proxy host itself', () => {
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) expect(isAllowedProxyOrigin(m, h({ origin: own }))).toBe(true)
  })

  it('refuses a write from another subdomain, another site or a lookalike', () => {
    for (const origin of ['https://www.msk-scripts.de', 'https://evil.example', `http://${PROXY_HOST}`, `${own}.evil.example`, 'null']) {
      expect(isAllowedProxyOrigin('POST', h({ origin }))).toBe(false)
    }
  })

  it('without Origin, only Sec-Fetch-Site same-origin passes', () => {
    expect(isAllowedProxyOrigin('POST', h({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
    expect(isAllowedProxyOrigin('POST', h({ 'sec-fetch-site': 'same-site' }))).toBe(false)
    expect(isAllowedProxyOrigin('POST', h({}))).toBe(false)
  })
})
