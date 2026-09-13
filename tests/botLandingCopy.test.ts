import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { GIVEAWAY_COPY } from '@/content/giveaway-copy'
import { TICKETBOT_COPY } from '@/content/ticketbot-copy'
import { BOT_LANDING_PATHS, giveawayMetadata, ticketBotMetadata } from '@/lib/botSeo'

/**
 * The two bot landing pages render their texts from `content/*-copy.ts` and
 * their icons from position-matched arrays in `components/bots/*`. If one
 * of the two orders breaks, the page renders a wrong icon or none at all,
 * without TypeScript noticing: an index access on
 * `readonly [...]` tuples yields `undefined`, and `undefined` as a component only throws
 * at runtime.
 *
 * That is why this test checks two things:
 *   1. EN and DE have the same number of entries in every list.
 *   2. The icon arrays in the component are as long as the text lists.
 *
 * Point 2 reads the component's source. That is deliberately crude: it catches
 * the common mistake (entry added in one of the two files, forgotten in the
 * other) and needs no JSX evaluation in the Node test run.
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
    ['hubCards',       'hubCards'],
    ['features',       'features'],
    ['verifySteps',    'verifySteps'],
    ['dashboardItems', 'dashboardItems'],
    ['hostedItems',    'hostedItems'],
    ['tierCards',      'tierCards'],
  ] as const)('EN and DE have the same number of %s', (_label, key) => {
    expect(de[key].length).toBe(en[key].length)
  })

  it.each([
    ['HUB_ICONS',       'hubCards'],
    ['HUB_HREFS',       'hubCards'],
    ['HUB_VARIANTS',    'hubCards'],
    ['FEATURE_ICONS',   'features'],
    ['VERIFY_ICONS',    'verifySteps'],
    ['DASHBOARD_ICONS', 'dashboardItems'],
    ['HOSTED_ICONS',    'hostedItems'],
  ] as const)('%s matches the length of %s', (arrayName, key) => {
    expect(countArrayEntries(ticketSource, arrayName)).toBe(en[key].length)
  })

  it('has no empty strings', () => {
    for (const copy of [en, de]) {
      for (const item of [...copy.features, ...copy.hubCards, ...copy.verifySteps]) {
        expect(item.title.trim()).not.toBe('')
        expect(item.text.trim()).not.toBe('')
      }
      expect(copy.headline.accent.trim()).not.toBe('')
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

  it.each([
    ['STEP_ICONS',     'steps'],
    ['FEATURE_ICONS',  'features'],
    ['COMMAND_NAMES',  'commandText'],
    ['SETTINGS_ICONS', 'settings'],
    ['COUPON_ICONS',   'coupons'],
    ['TRUST_ICONS',    'trust'],
  ] as const)('%s matches the length of %s', (arrayName, key) => {
    expect(countArrayEntries(giveawaySource, arrayName)).toBe(en[key].length)
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
      expect(languages['x-default']).toBe(paths.en)
    }
  })

  it('each version canonicalises to its own URL', () => {
    expect(ticketBotMetadata('en').alternates?.canonical).toBe('/ticketbot')
    expect(ticketBotMetadata('de').alternates?.canonical).toBe('/de/ticketbot')
    expect(giveawayMetadata('en').alternates?.canonical).toBe('/giveaway')
    expect(giveawayMetadata('de').alternates?.canonical).toBe('/de/giveaway')
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
})
