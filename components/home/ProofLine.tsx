import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { homeTranslations, type Lang } from '@/lib/i18n'
import { formatReversalRate, type ShopStats } from '@/lib/shopStats'
import type { HeadlineStat } from '@/lib/fivestats'
import { SITE_CONFIG } from '@/lib/config'

/**
 * The measured figures under the hero.
 *
 * Replaces a trust bar that claimed "500+ Customers", "500+ Servers" and
 * "24/7 Discord Support". The first two understated the real figure by roughly
 * a factor of three, and the third contradicted the page's own thesis that one
 * person writes and supports everything.
 *
 * Every entry here is measured and, where possible, linked to where it can be
 * checked. An entry whose source is unavailable is dropped rather than
 * replaced with an estimate — a page that shows four numbers of which one is
 * invented teaches the reader to discount the other three.
 */

interface Entry {
  value: string
  label: string
  href?: string
}

export function ProofLine({
  lang, stats, servers, docPages,
}: {
  lang: Lang
  stats: ShopStats | null
  servers: HeadlineStat | null
  /** Documentation pages, counted from its sitemap. `null` when unreachable. */
  docPages: number | null
}) {
  const t = homeTranslations[lang]
  const locale = lang === 'de' ? 'de-DE' : 'en-US'
  const num = (n: number) => n.toLocaleString(locale)

  const entries: Entry[] = []

  if (stats) {
    entries.push({ value: num(stats.uniqueBuyers), label: t.proof_buyers })
  }
  if (servers) {
    entries.push({
      value: num(servers.serverCount),
      label: t.proof_servers,
      href: '/resources',
    })
  }
  if (stats) {
    entries.push({
      value: `${formatReversalRate(stats.reversalRate, lang)} %`,
      label: t.proof_reversal,
    })
  }
  // Until 05.09.2026 this was a constant `206`. Measured while replacing it,
  // the real figure was 208: a hand-written number in a line that claims every
  // one of its figures is measured. If the source fails, the entry drops out,
  // same as the other three.
  if (docPages !== null && docPages > 0) {
    entries.push({ value: num(docPages), label: t.proof_docs, href: SITE_CONFIG.docs })
  }

  // Eine einzelne Zahl trägt keine Belegzeile.
  if (entries.length < 2) return null

  return (
    // `relative`, weil die Zeile im Hero steht und dessen absolut positionierter
    // Verlauf sonst darüber gemalt würde.
    <dl className="container-page relative flex flex-wrap items-baseline justify-center gap-x-9 gap-y-3 border-t border-[var(--color-border)] py-6 text-sm text-[var(--color-muted-foreground)]">
      {entries.map(e => (
        <div key={e.label} className="flex items-baseline gap-1.5">
          <dt className="sr-only">{e.label}</dt>
          <dd className="contents">
            <span className="font-mono text-[0.9375rem] font-bold tabular-nums tracking-tight text-[var(--color-foreground)]">
              {e.value}
            </span>
            {e.href ? (
              <Link
                href={e.href}
                className="border-b border-[var(--color-border)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]"
              >
                {e.label}
              </Link>
            ) : (
              <span>{e.label}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
