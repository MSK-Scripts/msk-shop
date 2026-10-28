import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { homeTranslations, type Lang } from '@/lib/i18n'
import type { ShopStats } from '@/lib/shopStats'
import type { HeadlineStat } from '@/lib/fivestats'
import { SITE_CONFIG } from '@/lib/config'

/**
 * At most three measured figures under the hero (plan 5.4), each linked to
 * where it can be checked when there is such a place.
 *
 * Replaces a trust bar that claimed "500+ Customers", "500+ Servers" and
 * "24/7 Discord Support". The first two understated the real figure by roughly
 * a factor of three, and the third contradicted the page's own thesis that one
 * person writes and supports everything.
 *
 * An entry whose source is unavailable is dropped rather than replaced with an
 * estimate: a line of three numbers of which one is invented teaches the
 * reader to discount the other two. The refund rate is not here; it belongs
 * on the about page (E6).
 */

interface Entry {
  value: string
  label: string
  href?: string
  external?: boolean
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
  const num = (n: number) => n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB')

  const entries: Entry[] = []
  if (stats) entries.push({ value: num(stats.uniqueBuyers), label: t.proof_buyers })
  if (servers) entries.push({ value: num(servers.serverCount), label: t.proof_servers, href: '/stats' })
  // Until 05.09.2026 this was a constant `206`; the real figure was 208. If
  // the source fails, the entry drops out, same as the other two.
  if (docPages !== null && docPages > 0) {
    entries.push({ value: num(docPages), label: t.proof_docs, href: SITE_CONFIG.docs, external: true })
  }

  // A single number does not make a line of proof.
  if (entries.length < 2) return null

  const labelClass = 'text-[var(--color-muted-foreground)]'
  const linkClass = `${labelClass} underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-primary)] hover:decoration-[var(--color-primary)]`

  return (
    <section aria-label={t.proof_label} className="border-b border-[var(--color-border)]">
      <dl className="container-page flex flex-wrap gap-x-[clamp(2rem,4vw,6rem)] gap-y-4 py-[clamp(1.25rem,1rem+1vw,2.25rem)]">
        {entries.map(e => (
          <div key={e.label} className="flex flex-col-reverse">
            <dt>
              {e.href && e.external ? (
                <a href={e.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{e.label}</a>
              ) : e.href ? (
                <Link href={e.href} className={linkClass}>{e.label}</Link>
              ) : (
                <span className={labelClass}>{e.label}</span>
              )}
            </dt>
            <dd className="font-display text-h2 font-bold tabular-nums tracking-[-0.015em]">{e.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
