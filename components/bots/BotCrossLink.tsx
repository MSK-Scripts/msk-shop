import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Gift, Ticket } from '@/components/icons'

import type { Lang } from '@/lib/i18n'

/**
 * Querverweis von einer Bot-Landingpage auf die andere.
 *
 * Beide Seiten hingen bisher an genau einer internen Quelle, dem „Bots"-Menü im
 * Header. Ein zusätzlicher thematisch passender Link stützt sie gegenseitig und
 * gibt Google einen beschreibenden Ankertext statt nur „Ticket Bot" in der
 * Navigation.
 *
 * Der Link bleibt in derselben Sprachfassung: von `/de/discord/ticket-bot` geht es auf
 * `/de/discord/giveaway-bot`, nicht auf die englische Seite. Das Präfix setzt `LocaleLink`,
 * hier steht der nackte Pfad.
 */
export function BotCrossLink({ lang, current }: { lang: Lang; current: 'ticketbot' | 'giveaway' }) {
  const toGiveaway = current === 'ticketbot'
  const de = lang === 'de'

  const href = toGiveaway ? '/discord/giveaway-bot' : '/discord/ticket-bot'

  const label = toGiveaway ? 'Discord Giveaway Bot' : 'Discord Ticket Bot'
  const lead  = de ? 'Ebenfalls von MSK Scripts:' : 'Also from MSK Scripts:'

  const blurb = toGiveaway
    ? (de
        ? 'kostenlos einladbar, neustartsicher und mehrsprachig.'
        : 'free to invite, restart-safe and multilingual.')
    : (de
        ? 'selbst gehostet, mit HTML-Transkripten und eigener Domain.'
        : 'self-hosted, with HTML transcripts and a custom domain.')

  const Icon = toGiveaway ? Gift : Ticket

  return (
    <p className="flex flex-wrap items-center gap-x-2 text-small text-[var(--color-muted-foreground)]">
      <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
      <span>{lead}</span>
      <Link href={href} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline">
        {label}
      </Link>
      <span>{blurb}</span>
    </p>
  )
}
