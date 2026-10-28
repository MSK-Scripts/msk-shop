import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { dashboardShellTranslations } from '@/lib/i18n'
import { TicketBotShell } from '../TicketBotShell'
import { loadTicketBotServer } from '../loadGuilds'

export const dynamic = 'force-dynamic'

/**
 * Shell of every page of one server: `/dashboard/ticket-bot/<server>/...`.
 *
 * The server in the address is untrusted. `loadTicketBotServer` only looks it
 * up in the servers the session owns; for anything else the shell shows the
 * same "not available" for a foreign, a revoked and a made-up server, and the
 * page below is not rendered at all. Each page checks on its own as well,
 * because Next renders layout and page independently.
 */
export default async function TicketBotServerLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string; server: string }>
}) {
  const { server } = await params
  const { lang, guilds, guild } = await loadTicketBotServer(server)
  const s = dashboardShellTranslations[lang]

  return (
    <TicketBotShell
      servers={guilds.map(g => ({ id: g.guild_id, name: g.guild_name, tier: g.tier }))}
      currentId={guild?.guild_id ?? null}
    >
      {guild ? children : (
        <EmptyState
          kind="unavailable"
          headingLevel="h1"
          title={s.tb_unavailable_title}
          action={
            <Button asChild>
              <Link href="/dashboard/ticket-bot" prefetch={false}>{s.tb_unavailable_action}</Link>
            </Button>
          }
        >
          {s.tb_unavailable_body}
        </EmptyState>
      )}
    </TicketBotShell>
  )
}
