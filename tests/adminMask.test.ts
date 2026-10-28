import { beforeAll, describe, expect, it } from 'vitest'

import { maskApiKey, maskEmail, maskIp, maskPersonalData, maskPersonalText, maskTag } from '@/lib/adminMask'

/**
 * The masking of personal data in the admin (plan 7). A data path: what the
 * browser receives. Each rule here has a counter-check in the Phase 10 log.
 */

beforeAll(() => { process.env.SESSION_SECRET = 'test-secret' })

const EMAIL = 'maximilian.mustermann@gmail.com'
const IP4 = '203.0.113.42'
const IP6 = '2001:db8:85a3::8a2e:370:7334'

describe('maskEmail', () => {
  it('keeps the first letters and the top-level domain, and adds a tag', () => {
    expect(maskEmail(EMAIL)).toMatch(/^m\*\*\*@g\*\*\*\.com #[0-9a-f]{4}$/)
    expect(maskEmail(EMAIL)).not.toContain('maximilian')
    expect(maskEmail(EMAIL)).not.toContain('gmail')
  })

  it('gives the same address the same tag and another address another one', () => {
    expect(maskEmail(EMAIL)).toBe(maskEmail(` ${EMAIL.toUpperCase()} `))
    // Same first letters, same provider: only the tag tells them apart.
    expect(maskEmail('max@gmail.com')).not.toBe(maskEmail('mia@gmail.com'))
  })

  it('masks a value without an @ whole', () => {
    expect(maskEmail('not-an-address')).toMatch(/^\*\*\* #[0-9a-f]{4}$/)
  })

  it('leaves an empty value empty', () => {
    expect(maskEmail('')).toBe('')
  })
})

describe('maskIp', () => {
  it('keeps two octets of an IPv4 address', () => {
    expect(maskIp(IP4)).toMatch(/^203\.0\.x\.x #[0-9a-f]{4}$/)
  })

  it('keeps two groups of an IPv6 address', () => {
    expect(maskIp(IP6)).toMatch(/^2001:db8:x:x #[0-9a-f]{4}$/)
    expect(maskIp(IP6)).not.toContain('7334')
  })

  it('tells two addresses of one network apart', () => {
    expect(maskIp('192.168.1.10')).not.toBe(maskIp('192.168.1.11'))
  })

  it('masks something that is no address whole', () => {
    expect(maskIp('garbage')).toMatch(/^x\.x\.x\.x #[0-9a-f]{4}$/)
  })
})

describe('maskTag', () => {
  it('depends on the secret, so a list of addresses cannot be checked offline', () => {
    const before = maskTag('email', EMAIL)
    process.env.SESSION_SECRET = 'another-secret'
    const after = maskTag('email', EMAIL)
    process.env.SESSION_SECRET = 'test-secret'
    expect(after).not.toBe(before)
    expect(maskTag('email', EMAIL)).toBe(before)
  })
})

describe('maskPersonalText', () => {
  it('masks every address inside a text and leaves the rest', () => {
    const text = `Chargeback by ${EMAIL} from ${IP4} and ${IP6}, at 12:30:45 on 2026-10-26T13:00:34+00:00`
    const masked = maskPersonalText(text)
    expect(masked).not.toContain(EMAIL)
    expect(masked).not.toContain(IP4)
    expect(masked).not.toContain('8a2e:370:7334')
    expect(masked).toContain('Chargeback by m***@g***.com #')
    // Times and dates look like an address to a pattern, not to isIP.
    expect(masked).toContain('12:30:45')
    expect(masked).toContain('2026-10-26T13:00:34+00:00')
  })

  it('does not take a version number glued to a letter for an address', () => {
    expect(maskPersonalText('msk_core v1.2.3.4')).toBe('msk_core v1.2.3.4')
  })
})

describe('maskPersonalData', () => {
  it('masks fields named like an address whatever they hold, and text everywhere', () => {
    const raw = {
      id: 7, email: EMAIL, payment_email: 'buyer@example.org', ip: IP4,
      user: { ign: 'Atlas', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5' },
      notes: [{ note: `Refund asked by ${EMAIL}` }],
    }
    const masked = maskPersonalData(raw)
    const json = JSON.stringify(masked)
    expect(json).not.toContain(EMAIL)
    expect(json).not.toContain('buyer@example.org')
    expect(json).not.toContain(IP4)
    expect(masked.id).toBe(7)
    expect(masked.user).toEqual(raw.user)
    expect(masked.ip).toMatch(/^203\.0\.x\.x #/)
  })

  it('leaves the input untouched', () => {
    const raw = { email: EMAIL }
    maskPersonalData(raw)
    expect(raw.email).toBe(EMAIL)
  })
})

describe('maskApiKey', () => {
  it('shows the start and the end of a key only', () => {
    expect(maskApiKey('mskt_abcdefghijklmnopqrstuvwxyz0123')).toBe('mskt_abc…0123')
    expect(maskApiKey('short')).toBe('••••')
  })
})
