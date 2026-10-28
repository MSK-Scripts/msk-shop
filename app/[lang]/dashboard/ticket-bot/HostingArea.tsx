'use client'

import { useEffect } from 'react'

import { Notice } from '@/components/dashboard/Notice'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLang } from '@/components/i18n/LangProvider'
import { dashboardTranslations } from '@/lib/i18n'
import { useJsonResource } from '@/lib/useAdminResource'
import { BotAddress } from './BotAddress'
import { BotControl } from './BotControl'
import { HostingSetup, RemoveHosting, RunningCard, type HostingStatus } from './HostingSetup'
import { LiveLogs } from './LiveLogs'
import type { DashboardGuild } from './loadGuilds'
import { hostingStatusUrl } from './ticketBotApi'

/**
 * Hosting of one server (plan 6.4): control first, then the address of the
 * bot's own dashboard, the live log as a tool, the credentials as the repair
 * layer, and removing in the danger zone at the end.
 *
 * Only rendered where the plan includes hosting; the page sends every other
 * plan to the overview before this is reached (lib/dashboardNav.ts).
 */
export function HostingArea({ guild }: { guild: DashboardGuild }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]
  const guildId = guild.guild_id

  const { data: status, error: loadError, reload } = useJsonResource<HostingStatus>(
    hostingStatusUrl(guildId), 'status', t.bot_err_network)

  const running = status?.job?.status === 'running'

  // Poll only while a run is actually in flight. `reload` touches state
  // strictly after its await, the same shape useJsonResource uses in its
  // mount effect, which keeps this clear of set-state-in-effect.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => { void reload() }, 3000)
    return () => window.clearInterval(id)
  }, [running, reload])

  // The page's row until the status has loaded, the status after that: it
  // knows about a set-up or a removal that happened since the page loaded.
  const hosted = status ? status.hosted : !!guild.is_hosted
  const addressHost = guild.dashboard_domain_status === 'active' && guild.dashboard_domain
    ? guild.dashboard_domain
    : guild.dashboard_host

  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      {loadError && <Notice tone="danger" role="alert">{loadError}</Notice>}

      {hosted && (
        <div className="grid items-start gap-[var(--app-gutter-y)] @7xl:grid-cols-2">
          <BotControl guildId={guildId} />
          {guild.bot_port != null && <BotAddress guildId={guildId} initialHost={addressHost} />}
        </div>
      )}

      {hosted && <LiveLogs guildId={guildId} />}

      {/* Until the status is in, the form would show the first set-up even to
          a hosted bot, so it waits. After a failed load it shows, as before. */}
      {running
        ? <RunningCard step={status!.job!.step} />
        : status || loadError
          ? <HostingSetup guildId={guildId} status={status} onDone={reload} />
          : <div role="status"><Skeleton className="h-48 w-full" /><span className="sr-only">{t.host_loading}</span></div>}

      {hosted && !running && <RemoveHosting guildId={guildId} onDone={reload} />}
    </div>
  )
}
