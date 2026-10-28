import type { StatusTone } from '@/components/dashboard/StatusBadge'
import { dashboardTranslations, type Lang } from '@/lib/i18n'

/** PM2's view of the hosted bot, as `/api/bot-control` reports it. */
export type BotStatus = 'online' | 'stopped' | 'stopping' | 'launching' | 'errored' | 'not_found' | 'unknown'

const KNOWN: readonly BotStatus[] = ['online', 'stopped', 'stopping', 'launching', 'errored', 'not_found', 'unknown']

/** Anything PM2 says that is not one of the states above counts as unknown. */
export function toBotStatus(value: unknown): BotStatus {
  return KNOWN.includes(value as BotStatus) ? value as BotStatus : 'unknown'
}

/** A running bot is fine, a starting or stopping one is on its way, everything else needs a look. */
export function botStatusTone(status: BotStatus): StatusTone {
  switch (status) {
    case 'online':    return 'success'
    case 'launching':
    case 'stopping':  return 'info'
    case 'stopped':
    case 'errored':   return 'danger'
    case 'not_found': return 'warning'
    case 'unknown':   return 'neutral'
  }
}

export function botStatusLabel(status: BotStatus, lang: Lang): string {
  const t = dashboardTranslations[lang]
  return {
    online:    t.bot_status_online,
    stopped:   t.bot_status_stopped,
    stopping:  t.bot_status_stopping,
    launching: t.bot_status_launching,
    errored:   t.bot_status_errored,
    not_found: t.bot_status_not_found,
    unknown:   t.bot_status_unknown,
  }[status]
}

/** A hosted bot in one of these states leaves the server without tickets. */
export function botIsDown(status: BotStatus | null): boolean {
  return status === 'stopped' || status === 'errored' || status === 'not_found'
}
