import type { Metadata } from 'next'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, ArrowSquareOut } from '@/components/icons'
import { Section } from '@/components/home/Section'
import { PageHero } from '@/components/page/PageHero'
import { aboutFigures } from '@/lib/aboutFigures'
import { SITE_CONFIG } from '@/lib/config'
import { loadDocPageCount } from '@/lib/docsPages'
import { loadHeadlineStat } from '@/lib/fivestats'
import {
  aboutPageTranslations, homeTranslations, layoutTranslations, packagesTranslations,
} from '@/lib/i18n'
import { pageSeo } from '@/lib/pageSeo'
import { publicPath } from '@/lib/routes'
import { alternatesFor, openGraphFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { loadShopStats } from '@/lib/shopStats'

/**
 * `/en/about` and `/de/ueber-msk`: the person behind MSK Scripts (plan 5.2,
 * 4.5). No photo of Moritz, by his decision: the page lives on text, measured
 * figures and links. NN/g asks that it becomes clear who is behind an offer,
 * not that there is a portrait.
 *
 * The facts are those of the imprint and of Moritz' own account (self-employed
 * since May 2022). The figures are measured and each names its source; one
 * whose source fails is left out, never estimated. The share of refunded or
 * charged-back payments sits here and not on the home page (decision E6).
 */

const MUSIKER15 = 'https://www.musiker15.de'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/about', lang)
  return {
    title:       seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/about'),
    openGraph:   openGraphFor({ url: publicPath(lang, '/about'), title: seo.title, description: seo.description }),
  }
}

export default async function AboutPage() {
  const [{ lang }, stats, headline, docPages] = await Promise.all([
    getRequestLang(),
    // Fail-soft: a source that fails drops its figure, nothing is estimated.
    loadShopStats().catch(() => null),
    loadHeadlineStat().catch(() => null),
    loadDocPageCount().catch(() => null),
  ])
  const t = aboutPageTranslations[lang]
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const locale = lang === 'de' ? 'de-DE' : 'en-GB'
  const measured = aboutFigures(lang, stats, headline?.serverCount ?? null, docPages)

  const facts: Array<[string, React.ReactNode]> = [
    [t.fact_brand, 'MSK Scripts'],
    [t.fact_owner, 'Moritz Kohm (Musiker15)'],
    [t.fact_since, t.fact_since_value],
    [t.fact_form, t.fact_form_value],
    [
      t.fact_place,
      <>
        {t.fact_place_value}.{' '}
        <Link href="/legal/imprint" className="font-semibold text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-hover)]">
          {t.imprint}
        </Link>
      </>,
    ],
    [t.fact_partner, t.fact_partner_value],
  ]

  const lines = [
    { href: '/fivem',   title: home.entry_fivem,   sub: home.entry_fivem_sub },
    { href: '/discord', title: home.entry_discord, sub: home.entry_discord_sub },
    { href: '/tools',   title: home.entry_tools,   sub: home.entry_tools_sub },
  ]

  const links = [
    { href: SITE_CONFIG.discord, title: 'Discord', sub: t.link_discord },
    { href: SITE_CONFIG.github, title: 'GitHub', sub: t.link_github },
    { href: SITE_CONFIG.docs, title: 'docu.msk-scripts.de', sub: t.link_docs },
    { href: MUSIKER15, title: 'musiker15.de', sub: t.link_site },
  ]

  return (
    <>
      <PageHero
        id="about-title"
        crumbs={[{ label: packagesTranslations[lang].breadcrumb_home, href: '/' }, { label: nav.nav_about }]}
        kicker={t.kicker}
        title={home.about_heading}
        lead={t.lead}
      />

      <Section id="who-title" kicker={t.who_kicker} title={t.who_title}>
        <div className="grid gap-[var(--space-stack)] @5xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @5xl:gap-x-[clamp(2rem,4cqi,6rem)]">
          <div className="grid content-start gap-4">
            <p className="max-w-[34rem] text-lead">{t.who_text_1}</p>
            <p className="max-w-[34rem] text-lead text-[var(--color-muted-foreground)]">{t.who_text_2}</p>
          </div>
          <dl aria-label={t.facts_label} className="grid content-start border-b border-[var(--color-border)]">
            {facts.map(([term, value]) => (
              <div key={term} className="grid gap-1 border-t border-[var(--color-border)] py-3 @md:grid-cols-[minmax(9rem,14rem)_minmax(0,1fr)] @md:gap-x-6">
                <dt className="font-semibold">{term}</dt>
                <dd className="max-w-[34rem] text-[var(--color-muted-foreground)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section id="build-title" kicker={t.build_kicker} title={t.build_title}>
        <ul className="grid border-b border-[var(--color-border)] @4xl:grid-cols-3 @4xl:gap-x-[clamp(2rem,3cqi,4rem)] @4xl:border-b-0">
          {lines.map(l => (
            <li key={l.href} className="border-t border-[var(--color-border)] @4xl:border-t-2 @4xl:border-[var(--color-primary)]">
              <Link href={l.href} className="group flex min-h-16 items-center justify-between gap-3 py-4">
                <span className="grid gap-0.5">
                  <span className="font-display text-h3 font-[650] group-hover:text-[var(--color-primary)]">{l.title}</span>
                  <span className="text-small text-[var(--color-muted-foreground)]">{l.sub}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-primary)] transition-transform duration-150 group-hover:translate-x-[3px]" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {measured.length > 0 && (
        <Section id="numbers-title" kicker={t.numbers_kicker} title={t.numbers_title} intro={t.numbers_intro}>
          <div className="grid gap-5">
            <dl className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--grid-card)),1fr))] gap-x-[clamp(2rem,3cqi,4rem)]">
              {measured.map(f => (
                <div key={f.label} className="grid content-start gap-1 border-t border-[var(--color-border)] py-5">
                  {/* Label first in the markup, as a definition list wants
                      it; the figure is shown on top. */}
                  <dt className="order-2 font-semibold">{f.label}</dt>
                  <dd className="order-1 font-display text-h2 font-bold tabular-nums tracking-[-0.015em]">{f.value}</dd>
                  <dd className="order-3 max-w-[34rem] text-small text-[var(--color-muted-foreground)]">
                    {f.href && f.external ? (
                      <a href={f.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-primary)] hover:decoration-[var(--color-primary)]">
                        {f.source}
                        <span className="sr-only"> {nav.nav_new_tab}</span>
                      </a>
                    ) : f.href ? (
                      <Link href={f.href} className="inline-flex min-h-11 items-center underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-primary)] hover:decoration-[var(--color-primary)]">
                        {f.source}
                      </Link>
                    ) : f.source}
                  </dd>
                </div>
              ))}
            </dl>
            {stats && (
              <p className="text-small text-[var(--color-muted-foreground)]">
                {t.n_asof.replace('{date}', stats.updatedAt.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }))}
              </p>
            )}
          </div>
        </Section>
      )}

      <Section id="links-title" kicker={t.links_kicker} title={t.links_title}>
        <ul className="grid gap-x-[clamp(2rem,3cqi,4rem)] border-b border-[var(--color-border)] @3xl:grid-cols-2">
          {links.map(l => (
            <li key={l.href} className="border-t border-[var(--color-border)]">
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="group flex min-h-16 items-center justify-between gap-3 py-4">
                <span className="grid gap-0.5">
                  <span className="font-display text-h3 font-[650] group-hover:text-[var(--color-primary)]">{l.title}</span>
                  <span className="text-small text-[var(--color-muted-foreground)]">{l.sub}</span>
                </span>
                <ArrowSquareOut className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
                <span className="sr-only"> {nav.nav_new_tab}</span>
              </a>
            </li>
          ))}
          <li className="border-t border-[var(--color-border)]">
            <a href={`mailto:${SITE_CONFIG.email}`} className="group flex min-h-16 items-center justify-between gap-3 py-4">
              <span className="grid gap-0.5">
                <span className="font-display text-h3 font-[650] group-hover:text-[var(--color-primary)]">{t.link_email}</span>
                <span className="text-small text-[var(--color-muted-foreground)]">{SITE_CONFIG.email}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            </a>
          </li>
        </ul>
      </Section>
    </>
  )
}
