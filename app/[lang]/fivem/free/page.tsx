import type { Metadata } from 'next'

import { ArrowSquareOut } from '@/components/icons'
import { TextLink } from '@/components/home/Section'
import { BrandTitle, PageHero } from '@/components/page/PageHero'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FREE_SCRIPT_IDS, packagesById } from '@/content/custom-packages'
import { loadResourceStats, type ResourceStat } from '@/lib/fivestats'
import {
  freePageTranslations, homeTranslations, layoutTranslations, packagesTranslations,
} from '@/lib/i18n'
import { pageSeo } from '@/lib/pageSeo'
import { publicPath } from '@/lib/routes'
import { alternatesFor, openGraphFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'

/**
 * `/en/fivem/free` and `/de/fivem/kostenlos`: the free FiveM scripts (plan
 * 5.2), one row each with what it does, its frameworks, the live server count
 * and the way to its source and documentation.
 *
 * Which scripts and every address come from content/custom-packages.ts, the
 * same list the home page shows. The server counts are fivestats.io's, as on
 * the statistics page; a script without a usable count shows none rather
 * than an estimate.
 *
 * No pictures: the entries in the content file only have banners, which are
 * the identical product banners of the exclusion list (4.2).
 */

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/fivem/free', lang)
  return {
    title:       seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/fivem/free'),
    openGraph:   openGraphFor({ url: publicPath(lang, '/fivem/free'), title: seo.title, description: seo.description }),
  }
}

function serverCounts(resources: ResourceStat[]): Map<string, number> {
  return new Map(resources.filter(r => r.available && r.serverCount > 0).map(r => [r.resourceName, r.serverCount]))
}

export default async function FreeScriptsPage() {
  const [{ lang }, stats] = await Promise.all([
    getRequestLang(),
    // Fail-soft: without fivestats the page still lists every script.
    loadResourceStats().catch(err => {
      console.warn('[fivem/free] fivestats unavailable:', err)
      return null
    }),
  ])
  const p = freePageTranslations[lang]
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const crumbs = packagesTranslations[lang]
  const counts = serverCounts(stats?.resources ?? [])
  const num = (n: number) => n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB')
  const scripts = packagesById(FREE_SCRIPT_IDS)
  const newTab = { newTab: nav.nav_new_tab }

  return (
    <>
      <PageHero
        id="free-title"
        crumbs={[
          { label: crumbs.breadcrumb_home, href: '/' },
          { label: crumbs.breadcrumb_fivem, href: '/fivem' },
          { label: nav.nav_fivem_free },
        ]}
        kicker={home.free_kicker}
        title={<BrandTitle template={p.title} />}
        lead={home.free_scripts_subtitle}
        actions={
          <>
            <TextLink href="/stats" tone="band">{p.servers_source}</TextLink>
            <TextLink href="/fivem" tone="band">{p.paid}</TextLink>
          </>
        }
      />

      <div className="border-t border-[var(--color-border)] py-[var(--space-section)]">
        <div className="container-page @container">
          <ul className="grid gap-x-[clamp(2rem,4cqi,6rem)] border-b border-[var(--color-border)] @4xl:grid-cols-2">
            {scripts.map(pkg => {
              const servers = counts.get(pkg.id)
              return (
                <li key={pkg.id} className="grid content-start gap-3 border-t border-[var(--color-border)] py-[clamp(1.25rem,1rem+1vw,2.25rem)]">
                  <div className="grid gap-1">
                    <h2 className="font-display text-product font-[750] [font-stretch:112%]">{pkg.name}</h2>
                    <p className="text-small text-[var(--color-muted-foreground)]">
                      <code className="font-mono">{pkg.id}</code>
                      {servers !== undefined && <> · {p.servers.replace('{n}', num(servers))}</>}
                    </p>
                  </div>
                  <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">
                    {lang === 'de' && pkg.descriptionDe ? pkg.descriptionDe : pkg.description}
                  </p>
                  {pkg.badges.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {pkg.badges.map(b => (
                        <li key={b.label}><Badge variant="tag" className="text-label normal-case tracking-normal">{b.label}</Badge></li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Button asChild variant="outline">
                      <a href={pkg.link} target="_blank" rel="noopener noreferrer">
                        GitHub
                        <ArrowSquareOut className="h-4 w-4" />
                        <span className="sr-only"> {pkg.name}, {nav.nav_new_tab}</span>
                      </a>
                    </Button>
                    {pkg.docsLink && <TextLink href={pkg.docsLink} external={newTab}>{p.docs}</TextLink>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}
