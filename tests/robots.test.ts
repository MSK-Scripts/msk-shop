import { describe, it, expect } from 'vitest'

import robots from '@/app/robots'

function disallowed(): string[] {
  const rules = robots().rules
  const rule  = Array.isArray(rules) ? rules[0] : rules
  const list  = rule.disallow ?? []
  return Array.isArray(list) ? list : [list]
}

/**
 * Every image page links the report form with its own `?url=`; the crawl of
 * 24.11.2026 found 8,478 of these addresses. Only the query variants are
 * blocked: the form itself is a legal requirement and has to stay reachable.
 */
describe('robots.txt and the report form', () => {
  it('blocks the query variants of the report form in both languages', () => {
    expect(disallowed()).toEqual(expect.arrayContaining(['/en/report?', '/de/inhalt-melden?']))
  })

  it('leaves the form itself crawlable', () => {
    const list = disallowed()
    expect(list).not.toContain('/en/report')
    expect(list).not.toContain('/de/inhalt-melden')
  })
})
