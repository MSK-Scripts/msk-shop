import { Fragment } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from '@/components/icons'
import { prefetchFor } from '@/components/layout/navigation'
import { homeTranslations, type Lang } from '@/lib/i18n'

/** The heading with its two brand words set in the band green (plan 4.4). */
function Title({ template }: { template: string }) {
  const words: Record<string, string> = { fivem: 'FiveM', discord: 'Discord' }
  return template.split(/\{(fivem|discord)\}/).map((part, i) =>
    i % 2 === 1
      ? <em key={i} className="not-italic text-[var(--color-band-accent)]">{words[part]}</em>
      : <Fragment key={i}>{part}</Fragment>,
  )
}

/**
 * The hero on the anthracite band (sample page of Phase 0): one sentence on
 * what MSK is, and the entry by need, one line per product line. From 1280 px
 * heading and entry list stand side by side (plan 4.7).
 *
 * Replaces the release log in terminal look, which is on the exclusion list
 * (4.2). The updates move to the product pages as a plain list (Phase 4).
 *
 * The prices are real data or nothing: the cheapest paid script from Tebex,
 * the cheapest ticket bot plan from lib/tiers.ts. Without Tebex the FiveM line
 * just shows no price.
 */
export function Hero({
  lang, fivemFrom, botFrom,
}: {
  lang: Lang
  /** Cheapest paid FiveM script, formatted, or null without Tebex data. */
  fivemFrom: string | null
  /** Cheapest paid ticket bot plan per month, formatted. */
  botFrom: string
}) {
  const t = homeTranslations[lang]

  const entries = [
    { href: '/fivem',   title: t.entry_fivem,   sub: t.entry_fivem_sub,   price: fivemFrom ? t.entry_fivem_price.replace('{price}', fivemFrom) : null },
    { href: '/discord', title: t.entry_discord, sub: t.entry_discord_sub, price: t.entry_discord_price.replace('{price}', botFrom) },
    { href: '/tools',   title: t.entry_tools,   sub: t.entry_tools_sub,   price: t.entry_tools_price },
  ]

  return (
    <section aria-labelledby="hero-title" className="surface-band">
      <div className="container-page grid items-end gap-[var(--space-stack)] py-[clamp(3rem,2rem+5vw,11rem)] min-[1280px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] min-[1280px]:gap-x-[clamp(3rem,5vw,10rem)]">
        <div className="grid gap-[clamp(1rem,0.5rem+1vw,2rem)]">
          <h1 id="hero-title" className="max-w-[18ch] text-display font-[750] tracking-[-0.02em]">
            <Title template={t.hero_title} />
          </h1>
          <p className="max-w-[46ch] text-lead text-[var(--color-band-muted)]">{t.hero_lead}</p>
        </div>

        <nav aria-label={t.entry_label} className="border-t-2 border-[var(--color-band-accent)]">
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-x-8 min-[1280px]:grid-cols-1">
            {entries.map(e => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  prefetch={prefetchFor(e.href)}
                  className="group flex h-full min-h-16 items-center justify-between gap-3 border-b border-[var(--color-band-line)] px-1 py-3.5 text-[var(--color-band-foreground)]"
                >
                  <span className="grid gap-0.5">
                    <span className="font-display text-h3 font-[650] group-hover:text-[var(--color-band-accent)]">{e.title}</span>
                    <span className="text-small text-[var(--color-band-muted)]">{e.sub}</span>
                    {e.price && <span className="text-small font-semibold tabular-nums">{e.price}</span>}
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-band-accent)] transition-transform duration-150 group-hover:translate-x-[3px]" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
