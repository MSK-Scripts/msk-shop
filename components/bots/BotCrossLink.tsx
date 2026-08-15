import Link from 'next/link'
import { Gift, Ticket } from 'lucide-react'

import type { Lang } from '@/lib/i18n'

/**
 * Querverweis von einer Bot-Landingpage auf die andere.
 *
 * Beide Seiten hingen bisher an genau einer internen Quelle, dem „Bots"-Menü im
 * Header. Ein zusätzlicher thematisch passender Link stützt sie gegenseitig und
 * gibt Google einen beschreibenden Ankertext statt nur „Ticket Bot" in der
 * Navigation.
 *
 * Der Link bleibt in derselben Sprachfassung: von `/de/ticketbot` geht es auf
 * `/de/giveaway`, nicht auf die englische Seite.
 */
export function BotCrossLink({ lang, current }: { lang: Lang; current: 'ticketbot' | 'giveaway' }) {
  const toGiveaway = current === 'ticketbot'
  const de = lang === 'de'

  const href = toGiveaway
    ? (de ? '/de/giveaway' : '/giveaway')
    : (de ? '/de/ticketbot' : '/ticketbot')

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
    <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-[var(--color-muted-foreground)]">
      <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
      <span>{lead}</span>
      <Link href={href} className="font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline">
        {label}
      </Link>
      <span>{blurb}</span>
    </p>
  )
}
