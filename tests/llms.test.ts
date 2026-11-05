import { describe, expect, it } from 'vitest'

import { botLandingEntries } from '@/lib/botSeo'
import { renderLlmsTxt } from '@/lib/llms'
import { PAGE_SEO } from '@/lib/pageSeo'
import { siteUrl } from '@/lib/siteUrl'

describe('renderLlmsTxt', () => {
  const text = renderLlmsTxt()

  it('opens with the brand and the description of the home page, as the format asks', () => {
    const [title, blank, summary] = text.split('\n')

    expect(title).toBe('# MSK Scripts')
    expect(blank).toBe('')
    expect(summary).toBe(`> ${PAGE_SEO['/'].en.description}`)
  })

  // The paid scripts are free on GitHub since 05.11.2026. Their pages
  // redirect, so a model must not be sent to them, nor to the old catalogue.
  it('leads to the free scripts instead of the retired shop pages', () => {
    expect(text).toContain('## FiveM scripts')
    expect(text).toContain(`- [${PAGE_SEO['/fivem/free'].en.title}](${siteUrl()}/en/fivem/free): ${PAGE_SEO['/fivem/free'].en.description}`)
    for (const retired of ['/en/fivem)', '/en/fivem/garage', '/en/fivem/handcuffs', '/en/fivem/vehiclekeys', '/en/fivem/all-access']) {
      expect(text, retired).not.toContain(retired)
    }
  })

  it('carries all three bot landing pages with the description their own page uses', () => {
    for (const bot of botLandingEntries('en')) {
      expect(text, bot.path).toContain(`](${siteUrl()}${bot.path}): ${bot.description}`)
      // The brand suffix belongs in a browser tab, not in a list under the brand.
      expect(bot.title).not.toMatch(/MSK Scripts$/)
    }
  })

  it('leaves no section empty', () => {
    expect(text).toContain('## Discord bots')
    expect(text).not.toMatch(/## [^\n]+\n\n## /)
  })

  it('names no price', () => {
    expect(text).not.toMatch(/€|EUR|\$\d/)
  })

  it('links only absolute addresses and never the purchase path', () => {
    const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1])

    expect(links.length).toBeGreaterThan(10)
    for (const link of links) {
      expect(link, link).toMatch(/^https:\/\//)
      expect(link, link).not.toMatch(/\/(cart|checkout|login|account|admin|api)(\/|$)/)
    }
  })

  it('ends with a single newline', () => {
    expect(text.endsWith('\n')).toBe(true)
    expect(text.endsWith('\n\n')).toBe(false)
  })
})
