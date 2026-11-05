import type { Metadata } from 'next'

import { ArrowRight } from '@/components/icons'
import { PageHead } from '@/components/page/PageHead'
import { SITE_CONFIG } from '@/lib/config'
import { packagesTranslations, sponsorTranslations } from '@/lib/i18n'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { parseSponsorStatus } from '@/lib/sponsorLink'

const SPONSORS_URL = 'https://github.com/sponsors/MSK-Scripts'

/**
 * noindex and no `alternates`: the page only ever shows the outcome of the
 * GitHub Sponsors verification that the Discord bot starts, see
 * app/api/sponsor/*. Without a status it reads as an error.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/sponsor/verify', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

/** `/en/sponsor/verify`, `/de/sponsor/verifizieren`: one short text per status. */
export default async function SponsorVerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lang } = await getRequestLang()
  const { status: raw } = await searchParams
  const status = parseSponsorStatus(raw)
  const t = sponsorTranslations[lang]
  const tp = packagesTranslations[lang]

  const link = 'flex min-h-11 items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 font-semibold hover:text-[var(--color-primary)]'
  const links = [
    // Someone who is already a sponsor does not need the way to become one.
    ...(status === 'granted' ? [] : [{ href: SPONSORS_URL, label: t.sponsor_link }]),
    { href: SITE_CONFIG.discord, label: t.discord_link },
  ]

  return (
    <div className="container-page grid gap-[var(--space-section)] pb-[var(--space-section)] pt-[clamp(1rem,0.5rem+1.5vw,3rem)]">
      <PageHead
        id="sponsor-title"
        crumbs={[{ label: tp.breadcrumb_home, href: '/' }, { label: t.breadcrumb }]}
        title={t[`${status}_title`]}
        lead={t[`${status}_text`]}
      />

      <ul className="grid max-w-[34rem] border-t border-[var(--color-border)]">
        {links.map(l => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noopener noreferrer" className={link}>
              {l.label}
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
