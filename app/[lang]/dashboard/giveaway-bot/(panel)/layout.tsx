import { GiveawayShell } from '../GiveawayShell'
import { GiveawayProvider } from '../GiveawayProvider'
import { loadGiveawaySession } from '../loadSession'

export const dynamic = 'force-dynamic'

/**
 * Shell and data of the signed-in giveaway dashboard. A route group, so the
 * sign-in page next to it (`../verify`) keeps the shell without navigation.
 * The data sits around the shell, so the server switcher can show the name
 * and icon the bot reports for the server.
 */
export default async function GiveawayPanelLayout({ children }: { children: React.ReactNode }) {
  const { guildId, owner } = await loadGiveawaySession()
  return (
    <GiveawayProvider owner={owner}>
      <GiveawayShell session={{ guildId, owner }}>{children}</GiveawayShell>
    </GiveawayProvider>
  )
}
