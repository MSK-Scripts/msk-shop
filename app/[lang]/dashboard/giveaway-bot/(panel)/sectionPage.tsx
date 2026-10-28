import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { getRequestLang } from '@/lib/serverLang'
import { publicPath } from '@/lib/routes'
import { dashboardShellTranslations, type Lang } from '@/lib/i18n'
import { giveawayHref, giveawaySections, type GiveawaySection } from '@/lib/dashboardNav'
import { GiveawayRefreshButton, GiveawaySection as Section } from '../DashboardClient'
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

/**
 * One area of the giveaway dashboard. The session is checked here as well as
 * in the layout, since Next renders the two independently. The Tebex area is
 * the owner's only, as its tab was; anyone else lands on the overview.
 */
export async function GiveawaySectionPage({ section }: { section: GiveawaySection }) {
  const { lang, owner } = await loadGiveawaySession()
  if (!giveawaySections(owner).includes(section)) {
    redirect(publicPath(lang, giveawayHref('overview')))
  }
  const { title, lead } = sectionCopy(lang, section)
  return (
    <>
      <PageHeader title={title} description={lead} action={<GiveawayRefreshButton />} />
      <Section section={section} />
    </>
  )
}
