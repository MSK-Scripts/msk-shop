import { describe, it, expect } from 'vitest'

import { returnUrl } from '@/lib/botDashboardProxy'
import { siteUrl } from '@/lib/siteUrl'

// A browser without a valid proxy session on the bot dashboard host goes back
// to the shop's ticket bot dashboard in its own language. The header only picks
// between /en and /de; it can never change the origin or the path.
describe('bot dashboard proxy bounce', () => {
  const en = `${siteUrl()}/en/dashboard/ticket-bot`
  const de = `${siteUrl()}/de/dashboard/ticket-bot`

  it.each([
    ['de-DE,de;q=0.9,en;q=0.8', de],
    ['de', de],
    ['en-US,en;q=0.9', en],
    ['fr-FR,fr;q=0.9', en],
    [null, en],
  ])('sends Accept-Language %s to the matching dashboard', (header, expected) => {
    expect(returnUrl(header)).toBe(expected)
  })

  it.each([
    'de;/../../evil.example',
    'https://evil.example',
    '\r\nLocation: https://evil.example',
  ])('keeps the shop origin and path for the header %s', header => {
    expect([en, de]).toContain(returnUrl(header))
  })
})
