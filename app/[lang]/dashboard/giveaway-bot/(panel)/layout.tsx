import { GiveawayShell } from '../GiveawayShell'
import { GiveawayProvider } from '../DashboardClient'
import { loadGiveawaySession } from '../loadSession'

export const dynamic = 'force-dynamic'

/**
 * Shell and data of the signed-in giveaway dashboard. A route group, so the
 * sign-in page next to it (`../verify`) keeps the shell without navigation.
 */
export default async function GiveawayPanelLayout({ children }: { children: React.ReactNode }) {
  const { guildId, owner } = await loadGiveawaySession()
  return (
    <GiveawayShell session={{ guildId, owner }}>
      <GiveawayProvider owner={owner}>{children}</GiveawayProvider>
    </GiveawayShell>
  )
}
