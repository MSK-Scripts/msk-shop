import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { getRequestLang } from '@/lib/serverLang'
import { publicPath } from '@/lib/routes'
import { dashboardShellTranslations, type Lang } from '@/lib/i18n'
import { ticketBotHref, ticketBotSections, type TicketBotSection } from '@/lib/dashboardNav'
import { DomainsArea } from '../DomainsArea'
import { HostingArea } from '../HostingArea'
import { loadTicketBotServer } from '../loadGuilds'
import { OverviewArea } from '../OverviewArea'
import { TranscriptsArea } from '../TranscriptsArea'

function sectionCopy(lang: Lang, section: TicketBotSection): { title: string; lead: string } {
  const s = dashboardShellTranslations[lang]
  switch (section) {
    case 'overview':    return { title: s.nav_overview,       lead: s.tb_overview_lead }
    case 'domains':     return { title: s.tb_nav_domains,     lead: s.tb_domains_lead }
    case 'transcripts': return { title: s.tb_nav_transcripts, lead: s.tb_transcripts_lead }
    case 'hosting':     return { title: s.tb_nav_hosting,     lead: s.tb_hosting_lead }
  }
}

export async function ticketBotSectionMetadata(section: TicketBotSection): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return {
    title: `${sectionCopy(lang, section).title} · ${dashboardShellTranslations[lang].tb_product}`,
    robots: { index: false, follow: false },
  }
}

/**
 * One area of one server. The four pages below `[server]` are this with
 * their area; since Phase 8 of the redesign each area is a component of its
 * own on the shared dashboard building blocks.
 *
 * Renders nothing for a server the session does not own: the layout shows
 * the "not available" state, and no data of such a server is loaded or
 * handed on. An area the server's plan does not include (hosting on Basic)
 * sends on to the overview, as the hidden tab did before.
 */
export async function TicketBotSectionPage({ params, section }: {
  params: Promise<{ server: string }>
  section: TicketBotSection
}) {
  const { server } = await params
  const { lang, guild } = await loadTicketBotServer(server)
  if (!guild) return null

  if (!ticketBotSections(guild.tier).includes(section)) {
    redirect(publicPath(lang, ticketBotHref(guild.guild_id, 'overview')))
  }

  const { title, lead } = sectionCopy(lang, section)
  return (
    <>
      <PageHeader
        title={title}
        description={
          <>
            <span className="font-semibold text-[var(--color-foreground)]">{guild.guild_name ?? guild.guild_id}</span>
            {' · '}
            {lead}
          </>
        }
      />
      {section === 'overview'    && <OverviewArea guild={guild} />}
      {section === 'domains'     && <DomainsArea guild={guild} serverIp={process.env.SERVER_PUBLIC_IP ?? ''} />}
      {section === 'transcripts' && <TranscriptsArea guildId={guild.guild_id} tier={guild.tier} />}
      {section === 'hosting'     && <HostingArea guild={guild} />}
    </>
  )
}
