import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { TIER_KEYS } from '@/components/bots/TicketBotTiers'
import { GIVEAWAY_COPY } from '@/content/giveaway-copy'
import { TICKETBOT_COPY } from '@/content/ticketbot-copy'
import {
  BOT_LANDING_PATHS, giveawayMetadata, ticketBotCompareMetadata, ticketBotMetadata,
} from '@/lib/botSeo'

/**
 * The two bot landing pages render their texts from `content/*-copy.ts` and
 * a few position-matched arrays from `components/bots/*` (link targets, the
 * command names, the tier order). If one of the two orders breaks, a text
 * lands next to the wrong link or none at all, without TypeScript noticing:
 * an index access on `readonly [...]` tuples yields `undefined`.
 *
 * That is why this test checks two things:
 *   1. EN and DE have the same number of entries in every list.
 *   2. The arrays in the component are as long as the text lists.
 *
 * Point 2 reads the component's source. That is deliberately crude: it catches
 * the common mistake (entry added in one of the two files, forgotten in the
 * other) and needs no JSX evaluation in the Node test run.
 *
 * Since Phase 5 of the redesign (28.10.2026) the icon arrays are gone with
 * the rows of icon cards (exclusion list 4.2), and the FAQ with decision E4.
 */

/** Counts the elements of a `const NAME = [ … ] as const` in the source. */
function countArrayEntries(source: string, name: string): number {
  const match = source.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`))
  if (!match) throw new Error(`Array ${name} nicht gefunden`)
  return match[1]
    .split(',')
    .map(s => s.replace(/\/\/.*$/gm, '').trim())
    .filter(Boolean).length
}

const ticketSource   = readFileSync(new URL('../components/bots/TicketBotLanding.tsx', import.meta.url), 'utf8')
const giveawaySource = readFileSync(new URL('../components/bots/GiveawayLanding.tsx', import.meta.url), 'utf8')

describe('ticket bot landing copy', () => {
  const { en, de } = TICKETBOT_COPY

  it.each([
    ['highlights',     'highlights'],
    ['problems',       'problems'],
    ['hubCards',       'hubCards'],
    ['features',       'features'],
    ['verifySteps',    'verifySteps'],
    ['dashboardItems', 'dashboardItems'],
    ['hostedItems',    'hostedItems'],
    ['tierCards',      'tierCards'],
    ['requirements',   'requirements'],
  ] as const)('EN and DE have the same number of %s', (_label, key) => {
    expect(de[key].length).toBe(en[key].length)
  })

  it('HUB_HREFS matches the length of hubCards', () => {
    expect(countArrayEntries(ticketSource, 'HUB_HREFS')).toBe(en.hubCards.length)
  })

  it('has one tier card per column of the price table', () => {
    expect(TIER_KEYS.length).toBe(en.tierCards.length)
  })

  it('has no empty strings', () => {
    for (const copy of [en, de]) {
      for (const item of [...copy.features, ...copy.hubCards, ...copy.verifySteps,
                          ...copy.problems, ...copy.requirements]) {
        expect(item.title.trim()).not.toBe('')
        expect(item.text.trim()).not.toBe('')
      }
      expect(copy.headline.accent.trim()).not.toBe('')
    }
  })

  it('only the free tier carries a hand-written price', () => {
    // Every paid card renders its price from TIER_CONFIG. A literal that creeps
    // back into the copy file would be a second source for the same number, and
    // the one the checkout does NOT read. § 312j (2) BGB wants the price shown
    // before the order button to be the price actually charged.
    for (const copy of [en, de]) {
      const overrides = copy.tierCards.filter(c => c.priceOverride !== null)
      expect(overrides.length).toBe(1)
      for (const card of copy.tierCards.slice(1)) {
        expect(card.priceOverride).toBeNull()
      }
    }
  })

  it('marks exactly one tier as the recommended one', () => {
    // The component derives the highlighted card from the badge. Two badges
    // would ring two cards, none would ring the wrong one.
    for (const copy of [en, de]) {
      expect(copy.tierCards.filter(c => c.badge !== null).length).toBe(1)
    }
  })

  it('keeps the target keyword in the H1', () => {
    // The reason for the whole rework: "Discord Ticket Bot" used to appear only in the
    // <title> and in a badge, not in the heading.
    for (const copy of [en, de]) {
      // This is exactly how the component assembles the heading: the separator
      // before the rest is part of the text, so German can use a comma there.
      const h1 = `${copy.headline.lead} ${copy.headline.accent}${copy.headline.tail}`
      expect(h1.toLowerCase()).toContain('discord')
      expect(h1.toLowerCase()).toContain('ticket bot')
    }
  })
})

describe('giveaway landing copy', () => {
  const { en, de } = GIVEAWAY_COPY

  it.each([
    ['highlights',  'highlights'],
    ['steps',       'steps'],
    ['features',    'features'],
    ['commandWho',  'commandWho'],
    ['commandText', 'commandText'],
    ['settings',    'settings'],
    ['coupons',     'coupons'],
    ['trust',       'trust'],
  ] as const)('EN and DE have the same number of %s', (_label, key) => {
    expect(de[key].length).toBe(en[key].length)
  })

  it('COMMAND_NAMES matches the length of commandText', () => {
    expect(countArrayEntries(giveawaySource, 'COMMAND_NAMES')).toBe(en.commandText.length)
  })

  it('has a role label for every command', () => {
    expect(en.commandWho.length).toBe(en.commandText.length)
    expect(de.commandWho.length).toBe(de.commandText.length)
  })

  it('keeps the target keyword in the H1', () => {
    for (const copy of [en, de]) {
      // This is exactly how the component assembles the heading: the separator
      // before the rest is part of the text, so German can use a comma there.
      const h1 = `${copy.headline.lead} ${copy.headline.accent}${copy.headline.tail}`
      expect(h1.toLowerCase()).toContain('discord')
      expect(h1.toLowerCase()).toContain('giveaway bot')
    }
  })
})

describe('hreflang pairing', () => {
  // A one-sided hreflang pair is worse than none: Google requires that
  // each version names both versions, otherwise it ignores the annotation.
  it.each([
    ['ticketbot', ticketBotMetadata, BOT_LANDING_PATHS.ticketbot],
    ['giveaway',  giveawayMetadata,  BOT_LANDING_PATHS.giveaway],
  ] as const)('%s names both language versions from either side', (_name, build, paths) => {
    for (const lang of ['en', 'de'] as const) {
      const languages = build(lang).alternates?.languages as Record<string, string>
      expect(languages.en).toBe(paths.en)
      expect(languages.de).toBe(paths.de)
      // The root picks the language and redirects: the hreflang fallback.
      expect(languages['x-default']).toBe('/')
    }
  })

  it('each version canonicalises to its own URL', () => {
    expect(ticketBotMetadata('en').alternates?.canonical).toBe('/en/discord/ticket-bot')
    expect(ticketBotMetadata('de').alternates?.canonical).toBe('/de/discord/ticket-bot')
    expect(giveawayMetadata('en').alternates?.canonical).toBe('/en/discord/giveaway-bot')
    expect(giveawayMetadata('de').alternates?.canonical).toBe('/de/discord/giveaway-bot')
  })

  it('the alternate link on the page points at the hreflang partner', () => {
    expect(TICKETBOT_COPY.en.altHref).toBe(BOT_LANDING_PATHS.ticketbot.de)
    expect(TICKETBOT_COPY.de.altHref).toBe(BOT_LANDING_PATHS.ticketbot.en)
    expect(GIVEAWAY_COPY.en.altHref).toBe(BOT_LANDING_PATHS.giveaway.de)
    expect(GIVEAWAY_COPY.de.altHref).toBe(BOT_LANDING_PATHS.giveaway.en)
  })

  it('titles stay inside the length Google renders', () => {
    for (const build of [ticketBotMetadata, giveawayMetadata]) {
      for (const lang of ['en', 'de'] as const) {
        const title = (build(lang).title as { absolute: string }).absolute
        expect(title.length).toBeLessThanOrEqual(65)
        expect(title).toContain('MSK Scripts')
      }
    }
  })

  // A description over ~160 characters is cut off mid-sentence in the SERP, and
  // the part that gets cut is the end, where the argument usually sits. The
  // ticket bot page shipped with 196 (EN) and 211 (DE) until 19.09.2026.
  //
  // One case per page and language so a failure names the page it belongs to.
  it.each([
    ['ticketbot', ticketBotMetadata, 'en'],
    ['ticketbot', ticketBotMetadata, 'de'],
    ['compare',   ticketBotCompareMetadata, 'en'],
    ['compare',   ticketBotCompareMetadata, 'de'],
    ['giveaway',  giveawayMetadata,  'en'],
    ['giveaway',  giveawayMetadata,  'de'],
  ] as const)('%s (%s) description stays inside the length Google renders', (_name, build, lang) => {
    expect(String(build(lang).description).length).toBeLessThanOrEqual(160)
  })
})
