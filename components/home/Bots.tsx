import Image from 'next/image'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Section, TextLink } from '@/components/home/Section'
import { Button } from '@/components/ui/Button'
import { homeTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * The two Discord bots, in a zigzag of picture and text (plan 5.4), with the
 * price and the way into each bot: overview (main action), dashboard (second),
 * statistics (text link).
 *
 * The pictures are the bot banners from `public/` for now. The plan asks for
 * Discord and dashboard screenshots here; they come with the bot pages in
 * Phase 5.
 */
const BOTS = [
  {
    key: 'ticket',
    name: 'Ticket Bot',
    image: '/msk-ticket-bot-banner.webp',
    href: '/discord/ticket-bot',
    dashboard: '/dashboard/ticket-bot',
    stats: '/discord/ticket-bot/stats',
  },
  {
    key: 'giveaway',
    name: 'Giveaway Bot',
    image: '/msk-giveaway-bot-banner.webp',
    href: '/discord/giveaway-bot',
    dashboard: '/dashboard/giveaway-bot',
    stats: '/discord/giveaway-bot/stats',
  },
] as const

export function Bots({ lang, ticketFrom }: { lang: Lang; ticketFrom: string }) {
  const t = homeTranslations[lang]
  const copy = {
    ticket:   { desc: t.bot_ticket_desc,   price: t.bot_price_ticket.replace('{price}', ticketFrom) },
    giveaway: { desc: t.bot_giveaway_desc, price: t.bot_price_giveaway },
  }

  return (
    <Section id="bots-title" kicker={t.bots_kicker} title={t.bots_heading} intro={t.bots_subtitle}>
      <ul className="grid gap-[calc(2*var(--space-stack))]">
        {BOTS.map((bot, i) => (
          <li key={bot.key} className="grid items-center gap-x-[clamp(2rem,4cqi,5rem)] gap-y-5 @3xl:grid-cols-2">
            <div
              className={cn(
                'relative aspect-video overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]',
                i % 2 === 1 && '@3xl:order-last',
              )}
            >
              <Image
                src={bot.image}
                // The banner shows logo and wordmark of the bot, so it says
                // something and is named after it.
                alt={`MSK ${bot.name}`}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1599px) 50vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="grid content-center gap-3">
              <h3 className="font-display text-product font-[750] [font-stretch:112%]">{bot.name}</h3>
              <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{copy[bot.key].desc}</p>
              <p className="font-semibold tabular-nums">{copy[bot.key].price}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href={bot.href}>{t.bot_overview}</Link>
                </Button>
                {/* Session-dependent, may answer with redirect(): not
                    prefetched, or the router cache would replay a redirect
                    decided while signed out. */}
                <Button asChild variant="outline">
                  <Link href={bot.dashboard} prefetch={false}>{t.bot_dashboard}</Link>
                </Button>
                <TextLink href={bot.stats}>{t.bot_stats}</TextLink>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
