import { SITE_CONFIG } from '@/lib/config'
import { aboutPageTranslations, type Lang } from '@/lib/i18n'
import { formatReversalRate, type ShopStats } from '@/lib/shopStats'

/**
 * The measured figures of the about page, each with the source a reader can
 * check it against. A figure whose source failed is left out, never
 * estimated: a list of five numbers of which one is invented teaches the
 * reader to discount the other four.
 *
 * The share of refunded or charged-back payments is here and not on the home
 * page (decision E6 of the redesign plan). It is the `reversal_rate` that
 * scripts/tebex-stats.js writes nightly: refunds plus chargebacks over all
 * settled payments. The counts beside it come from the same row, so rate and
 * counts cannot describe two different nights.
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
  stats: ShopStats | null,
  servers: number | null,
  docPages: number | null,
): AboutFigure[] {
  const t = aboutPageTranslations[lang]
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  const num = (n: number) => n.toLocaleString(locale)
  const out: AboutFigure[] = []

  if (stats) out.push({ value: num(stats.uniqueBuyers), label: t.n_buyers, source: t.n_buyers_source })
  if (servers !== null && servers > 0) {
    out.push({ value: num(servers), label: t.n_servers, source: t.n_servers_source, href: '/stats' })
  }
  if (docPages !== null && docPages > 0) {
    out.push({ value: num(docPages), label: t.n_docs, source: t.n_docs_source, href: SITE_CONFIG.docs, external: true })
  }
  if (stats) {
    const settled = stats.completedPayments + stats.refunds + stats.chargebacks
    // Without a settled payment the rate is 0 by default, not by measurement.
    if (settled > 0) {
      const rate = formatReversalRate(stats.reversalRate, lang)
      out.push({
        value: lang === 'de' ? `${rate} %` : `${rate}%`,
        label: t.n_reversal,
        source: t.n_reversal_source
          .replace('{refunds}', num(stats.refunds))
          .replace('{chargebacks}', num(stats.chargebacks))
          .replace('{settled}', num(settled)),
      })
    }
    if (stats.firstPaymentAt && !Number.isNaN(stats.firstPaymentAt.getTime())) {
      out.push({
        value: stats.firstPaymentAt.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
        label: t.n_first,
        source: t.n_buyers_source,
      })
    }
  }
  return out
}
