import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Plus } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { getRequestLang } from '@/lib/serverLang'
import { publicPath } from '@/lib/routes'
import { dashboardShellTranslations, giveawayDashboardTranslations, type Lang } from '@/lib/i18n'
import {
  GIVEAWAY_NEW_HREF, TEMPLATE_NEW_HREF, giveawayHref, giveawaySections, type GiveawaySection,
} from '@/lib/dashboardNav'
import { GiveawayRefreshButton } from '../GiveawayProvider'
import { GiveawayLoadGate, GiveawaySection as Section } from '../GiveawaySection'
import { loadGiveawaySession } from '../loadSession'

function sectionCopy(lang: Lang, section: GiveawaySection): { title: string; lead: string } {
  const s = dashboardShellTranslations[lang]
  switch (section) {
    case 'overview':  return { title: s.nav_overview,     lead: s.gw_overview_lead }
    case 'giveaways': return { title: s.gw_nav_giveaways, lead: s.gw_giveaways_lead }
    case 'templates': return { title: s.gw_nav_templates, lead: s.gw_templates_lead }
    case 'settings':  return { title: s.gw_nav_settings,  lead: s.gw_settings_lead }
    case 'store':     return { title: s.gw_nav_store,     lead: s.gw_store_lead }
  }
}

export async function giveawaySectionMetadata(section: GiveawaySection): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return {
    title: `${sectionCopy(lang, section).title} · ${dashboardShellTranslations[lang].gw_product}`,
    robots: { index: false, follow: false },
  }
}

/** The page's main action: what one comes to the area for. */
function NewLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild>
      <Link href={href} prefetch={false}><Plus className="h-4 w-4" />{label}</Link>
    </Button>
  )
}

/**
 * One area of the giveaway dashboard. The session is checked here as well as
 * in the layout, since Next renders the two independently. The Tebex area is
 * the owner's only, as its tab was; anyone else lands on the overview.
 *
 * Refreshing is offered where the page shows lists. On settings and store it
 * would throw away what was typed, so they have none.
 */
export async function GiveawaySectionPage({ section }: { section: GiveawaySection }) {
  const { lang, owner } = await loadGiveawaySession()
  if (!giveawaySections(owner).includes(section)) {
    redirect(publicPath(lang, giveawayHref('overview')))
  }
  const t = giveawayDashboardTranslations[lang]
  const { title, lead } = sectionCopy(lang, section)
  const lists = section === 'overview' || section === 'giveaways' || section === 'templates'
  return (
    <>
      <PageHeader
        title={title}
        description={lead}
        action={lists && (
          <>
            <GiveawayRefreshButton />
            {section === 'giveaways' && <NewLink href={GIVEAWAY_NEW_HREF} label={t.new_giveaway} />}
            {section === 'templates' && <NewLink href={TEMPLATE_NEW_HREF} label={t.tpl_new} />}
          </>
        )}
      />
      <Section section={section} />
    </>
  )
}

export type GiveawaySubPageKind = 'newGiveaway' | 'giveaway' | 'newTemplate' | 'template'

export async function giveawaySubPageMetadata(kind: GiveawaySubPageKind): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const t = giveawayDashboardTranslations[lang]
  const title = { newGiveaway: t.new_giveaway, giveaway: t.meta_giveaway, newTemplate: t.tpl_new, template: t.meta_template }[kind]
  return {
    title: `${title} · ${dashboardShellTranslations[lang].gw_product}`,
    robots: { index: false, follow: false },
  }
}

/**
 * A page below an area: a new giveaway, one giveaway, a template. Signed-in
 * only, like the areas; the page draws its own head once the data is there,
 * since its title is the giveaway's or the template's.
 */
export async function GiveawaySubPage({ children }: { children: ReactNode }) {
  await loadGiveawaySession()
  return <GiveawayLoadGate>{children}</GiveawayLoadGate>
}
