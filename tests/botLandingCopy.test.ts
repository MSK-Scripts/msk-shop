import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { GIVEAWAY_COPY } from '@/content/giveaway-copy'
import { TICKETBOT_COPY } from '@/content/ticketbot-copy'
import { BOT_LANDING_PATHS, giveawayMetadata, ticketBotMetadata } from '@/lib/botSeo'

/**
 * Die beiden Bot-Landingpages rendern ihre Texte aus `content/*-copy.ts` und
 * ihre Icons aus positionsgleichen Arrays in `components/bots/*`. Bricht eine
 * der beiden Reihenfolgen, rendert die Seite ein falsches oder gar kein Icon,
 * ohne dass TypeScript etwas merkt: Ein Zugriff über den Index liefert für
 * `readonly [...]`-Tupel `undefined`, und `undefined` als Komponente wirft erst
 * zur Laufzeit.
 *
 * Deshalb prüft dieser Test zwei Dinge:
 *   1. EN und DE haben in jeder Liste gleich viele Einträge.
 *   2. Die Icon-Arrays in der Komponente sind genauso lang wie die Textlisten.
 *
 * Punkt 2 liest den Quelltext der Komponente. Das ist bewusst grob: Es fängt
 * den häufigen Fehler (Eintrag in einer der beiden Dateien ergänzt, in der
 * anderen vergessen) und verlangt keine JSX-Auswertung im Node-Testlauf.
 */

/** Zählt die Elemente eines `const NAME = [ … ] as const` im Quelltext. */
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
    // Der Grund für den ganzen Umbau: „Discord Ticket Bot" stand vorher nur im
    // <title> und in einem Badge, nicht in der Überschrift.
    for (const copy of [en, de]) {
      // Genau so setzt die Komponente die Überschrift zusammen: der Trenner
      // vor dem Rest steckt im Text, damit Deutsch dort ein Komma nutzen kann.
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
      // Genau so setzt die Komponente die Überschrift zusammen: der Trenner
      // vor dem Rest steckt im Text, damit Deutsch dort ein Komma nutzen kann.
      const h1 = `${copy.headline.lead} ${copy.headline.accent}${copy.headline.tail}`
      expect(h1.toLowerCase()).toContain('discord')
      expect(h1.toLowerCase()).toContain('giveaway bot')
    }
  })
})

describe('hreflang pairing', () => {
  // Ein einseitiges hreflang-Paar ist schlimmer als keins: Google verlangt, dass
  // jede Fassung beide Fassungen nennt, sonst wertet es die Angabe nicht.
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
