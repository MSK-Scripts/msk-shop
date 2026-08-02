import { ArrowRight } from 'lucide-react'
import { homeTranslations, type Lang } from '@/lib/i18n'
import { SITE_CONFIG } from '@/lib/config'
import type { ReleaseEntry } from '@/lib/releases'

/**
 * Release log next to the hero headline.
 *
 * It replaced a decorative terminal mockup that contained an invented
 * benchmark. The point of the section is that "still maintained" is the one
 * claim a competing shop cannot copy, and a dated version number proves it
 * where an adjective cannot.
 *
 * Renders nothing when the upstream source is unavailable — see lib/releases.ts.
 */
export function ReleaseFeed({ lang, releases }: { lang: Lang; releases: ReleaseEntry[] }) {
  if (releases.length === 0) return null

  const t = homeTranslations[lang]
  const locale = lang === 'de' ? 'de-DE' : 'en-US'

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_60%,var(--color-card))] px-4 py-2.5">
        <span className="pulse-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {t.release_title}
        </span>
        <span className="ml-auto font-mono text-[0.6875rem] tabular-nums text-[var(--color-muted-foreground)]">
          {t.release_count.replace('{n}', String(releases.length))}
        </span>
      </div>

      <ul>
        {releases.map(r => (
          <li
            key={r.resourceName}
            className="border-b border-[var(--color-border)] px-4 py-3 last:border-b-0"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-semibold">{r.resourceName}</span>
              <span className="ml-auto font-mono text-xs font-bold tabular-nums text-[var(--color-primary)]">
                v{r.version}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              <time dateTime={r.date} className="font-mono tabular-nums">
                {new Date(r.date).toLocaleDateString(locale, {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </time>
              {r.summary && <> · {r.summary}</>}
            </p>
          </li>
        ))}
      </ul>

      <a
        href={SITE_CONFIG.docs}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_60%,var(--color-card))] px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:underline"
      >
        {t.release_docs}
        <ArrowRight className="h-3 w-3" />
      </a>
    </div>
  )
}
