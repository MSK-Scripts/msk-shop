import { SITE_CONFIG } from '@/lib/config'
import { aboutPageTranslations, type Lang } from '@/lib/i18n'

/**
 * The measured figures of the about page, each with the source a reader can
 * check it against. A figure whose source failed is left out, never
 * estimated: a list of numbers of which one is invented teaches the reader
 * to discount the others.
 *
 * Until 05.11.2026 the list also held the shop figures from the nightly Tebex
 * snapshot (unique buyers, refund rate, first sale). The shop stopped selling
 * FiveM scripts that day, so those figures would only describe the past.
 */

export interface AboutFigure {
  value: string
  label: string
  source: string
  href?: string
  external?: boolean
}

export function aboutFigures(
  lang: Lang,
  discordMembers: number | null,
  servers: number | null,
  docPages: number | null,
): AboutFigure[] {
  const t = aboutPageTranslations[lang]
  const num = (n: number) => n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB')
  const out: AboutFigure[] = []

  if (discordMembers !== null && discordMembers > 0) {
    out.push({ value: num(discordMembers), label: t.n_discord, source: t.n_discord_source, href: SITE_CONFIG.discord, external: true })
  }
  if (servers !== null && servers > 0) {
    out.push({ value: num(servers), label: t.n_servers, source: t.n_servers_source, href: '/stats' })
  }
  if (docPages !== null && docPages > 0) {
    out.push({ value: num(docPages), label: t.n_docs, source: t.n_docs_source, href: SITE_CONFIG.docs, external: true })
  }
  return out
}
