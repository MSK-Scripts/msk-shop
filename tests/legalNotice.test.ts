import { describe, it, expect } from 'vitest'

import { legalNotice } from '@/lib/legalNotice'

/**
 * Which English legal page says the German version prevails. A precedence
 * clause on the privacy policy or the withdrawal instructions would be wrong
 * (Art. 12 GDPR, § 356 (3) BGB), and one without the consumer sentence on the
 * terms would hold up worse (§ 305c (2) BGB). Draft of 27.10.2026, section 1.3.
 */
describe('legalNotice', () => {
  const full = (n: ReturnType<typeof legalNotice>) => `${n?.lead ?? ''} ${n?.text ?? ''}`

  it('lets the German terms prevail, with the consumer sentence', () => {
    const n = legalNotice('terms', 'en')
    expect(full(n)).toContain('the German version prevails')
    expect(full(n)).toContain('If you are a consumer, you may rely on this English version')
    expect(full(n)).toContain('Contract languages are German and English.')
  })

  it('lets the German DPA prevail, without the consumer sentence', () => {
    const n = legalNotice('dpa', 'en')
    expect(full(n)).toContain('the German version prevails')
    expect(full(n)).not.toContain('consumer')
  })

  it('gives privacy policy and withdrawal instructions no precedence clause', () => {
    for (const kind of ['privacy', 'withdrawal'] as const) {
      const n = legalNotice(kind, 'en')
      expect(n, kind).not.toBeNull()
      expect(full(n), kind).not.toMatch(/prevail|authoritative|binding/i)
      expect(full(n), kind).toContain('available in German')
    }
  })

  it('gives the imprint no notice', () => {
    expect(legalNotice('imprint', 'en')).toBeNull()
    expect(legalNotice('imprint', 'de')).toBeNull()
  })

  it('links the translation from the German pages', () => {
    for (const kind of ['terms', 'dpa', 'privacy', 'withdrawal'] as const) {
      expect(legalNotice(kind, 'de')?.link, kind).toBe('Englische Übersetzung')
    }
  })
})
