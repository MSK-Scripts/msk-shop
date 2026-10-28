import { describe, expect, it } from 'vitest'

import { botLandingEntries } from '@/lib/botSeo'
import { PRODUCT_COPY } from '@/lib/config'
import { renderLlmsTxt } from '@/lib/llms'
import { PAGE_SEO } from '@/lib/pageSeo'
import { siteUrl } from '@/lib/siteUrl'

import type { TebexPackage } from '@/types/tebex'

const pkg = (p: Partial<TebexPackage>) => ({ slug: null, media: [], type: 'single', ...p }) as unknown as TebexPackage

const PACKAGES = [
  pkg({ id: 5732587, name: 'MSK Garage - Encrypted Version', description: '<p>Garage.</p>', category: { id: 2105296, name: 'Encrypted Version' } }),
  pkg({ id: 5732588, name: 'MSK Garage - Source Version', description: '<p>Garage.</p>', category: { id: 2228937, name: 'Source Version' } }),
  pkg({ id: 999,     name: 'Unlisted Package',               description: '<p>Plain <b>Tebex</b> text.</p>' }),
]

describe('renderLlmsTxt', () => {
  const text = renderLlmsTxt(PACKAGES)

  it('opens with the brand and the description of the home page, as the format asks', () => {
    const [title, blank, summary] = text.split('\n')

    expect(title).toBe('# MSK Scripts')
    expect(blank).toBe('')
    expect(summary).toBe(`> ${PAGE_SEO['/'].en.description}`)
  })

  it('lists a product once, under its address and the curated search title', () => {
    const curated = PRODUCT_COPY.garage.seo.en

    expect(text).toContain(`- [${curated.title}](${siteUrl()}/en/fivem/garage): ${curated.description}`)
    expect(text).not.toContain('MSK Garage - Encrypted Version')
    expect(text).not.toContain('/en/fivem/5732587')
    expect(text.split(`/en/fivem/garage)`).length - 1).toBe(1)
  })

  it('falls back to the Tebex name and a plain-text excerpt for a product without copy', () => {
    expect(text).toContain(`- [Unlisted Package](${siteUrl()}/en/fivem/unlisted-package): Plain Tebex text.`)
  })

  it('carries all three bot landing pages with the description their own page uses', () => {
    for (const bot of botLandingEntries('en')) {
      expect(text, bot.path).toContain(`](${siteUrl()}${bot.path}): ${bot.description}`)
      // The brand suffix belongs in a browser tab, not in a list under the brand.
      expect(bot.title).not.toMatch(/MSK Scripts$/)
    }
  })

  // Tebex being down must not take the file with it: the route passes an empty
  // list, and everything that does not come from Tebex has to stay.
  it('stays complete without packages', () => {
    const bare = renderLlmsTxt([])

    expect(bare).toContain('## FiveM scripts')
    expect(bare).toContain(`](${siteUrl()}/en/fivem): `)
    expect(bare).toContain('## Discord bots')
    expect(bare).not.toMatch(/## [^\n]+\n\n## /)
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
