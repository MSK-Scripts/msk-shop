import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Footer, footerColumns, trustItems } from '@/components/layout/Footer'
import { LangProvider } from '@/components/i18n/LangProvider'
import { LANGS } from '@/lib/lang'
import type { Lang } from '@/lib/i18n'

/**
 * The legal links of the footer.
 *
 * The imprint must be reachable in one click from every page (§ 5 DDG), the
 * withdrawal and cancellation buttons keep their prescribed wording (§ 356a
 * and § 312k BGB), and the trust line links each claim to the text that backs
 * it. A footer that points "Impressum" at a page that does not exist, or at
 * the wrong one, breaks a legal duty without any test or type check noticing.
 */

// The cast only tells createElement that `children` comes as its third argument.
const html = (lang: Lang, path = '/') =>
  renderToStaticMarkup(
    createElement(LangProvider, { lang, path } as ComponentProps<typeof LangProvider>, createElement(Footer)),
  )

/**
 * href of the first link whose text is exactly `label`. The text is the
 * link's content split at its tags, which only reads it; nothing is
 * sanitised or rendered from it.
 */
function hrefOf(markup: string, label: string): string | null {
  for (const m of markup.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g)) {
    if (m[2].split(/<[^>]*>/).join('').trim() === label) return m[1]
  }
  return null
}

const EXPECTED: Record<Lang, Array<[string, string]>> = {
  en: [
    ['Imprint',                   '/en/legal/imprint'],
    ['Privacy Policy',            '/en/legal/privacy'],
    ['Terms & Conditions',        '/en/legal/terms'],
    ['Withdrawal Instructions',   '/en/legal/withdrawal'],
    ['Data Processing Agreement', '/en/legal/dpa'],
    ['Withdraw from contract',    '/en/withdraw-contract'],
    ['Cancel contracts here',     '/en/cancel-contract'],
    ['Report content',            '/en/report'],
  ],
  de: [
    ['Impressum',              '/de/rechtliches/impressum'],
    ['Datenschutz',            '/de/rechtliches/datenschutz'],
    ['AGB',                    '/de/rechtliches/agb'],
    ['Widerrufsbelehrung',     '/de/rechtliches/widerrufsbelehrung'],
    ['Auftragsverarbeitung',   '/de/rechtliches/avv'],
    ['Vertrag widerrufen',     '/de/vertrag-widerrufen'],
    ['Verträge hier kündigen', '/de/vertrag-kuendigen'],
    ['Inhalt melden',          '/de/inhalt-melden'],
  ],
}

describe('footer legal links', () => {
  it.each(LANGS)('point to the legal pages and contract buttons of their language (%s)', lang => {
    const markup = html(lang).replace(/&amp;/g, '&')
    for (const [label, href] of EXPECTED[lang]) {
      expect(hrefOf(markup, label), label).toBe(href)
    }
  })

  it.each(LANGS)('lead to pages that exist (%s)', lang => {
    const legal = footerColumns(lang).slice(2).flatMap(col => col.links)
    const trust = trustItems(lang).flatMap(item => (item.href ? [item.href] : []))
    for (const href of [...legal.map(l => l.href), ...trust]) {
      expect(existsSync(join(process.cwd(), 'app', '[lang]', ...href.split('/').filter(Boolean), 'page.tsx')), href).toBe(true)
    }
  })

  it('back each trust claim with the text it rests on', () => {
    const [licence, statutory, refund] = trustItems('de')
    expect(licence.href).toBe('/legal/terms')
    expect(statutory.href).toBe('/legal/withdrawal')
    expect(refund.href).toBe('/legal/terms')
  })

  it('are on every page, bot pages and dashboards included', () => {
    for (const path of ['/', '/discord/ticket-bot', '/dashboard/ticket-bot', '/legal/terms']) {
      expect(hrefOf(html('de', path), 'Impressum'), path).toBe('/de/rechtliches/impressum')
    }
  })
})
