import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, Check } from '@/components/icons'
import { TextLink } from '@/components/home/Section'
import { BrandTitle, HeroLinks, PageHero } from '@/components/page/PageHero'
import { Button } from '@/components/ui/Button'
import { GIVEAWAY_COPY } from '@/content/giveaway-copy'
import { TICKETBOT_COPY } from '@/content/ticketbot-copy'
import {
  discordPageTranslations, homeTranslations, layoutTranslations, packagesTranslations, type Lang,
} from '@/lib/i18n'
import { cheapestPaidTier, formatTierPrice } from '@/lib/tiers'

/**
 * `/discord`: the two bots side by side, each with what it does, where its
 * price starts and the way to its page (plan 5.2).
 *
 * The descriptions and prices are the home page's, the facts the ones each
 * bot page lists beside its heading, so the three places cannot drift apart.
 * The ticket bot's "from" price is the cheapest paid plan in lib/tiers.ts.
 *
 * No pictures yet. The bot banners carry the old green mono eyebrow with a
 * dash (exclusion list 4.2), and screenshots from Discord and the dashboards
 * are still to come; each block is laid out to read without one.
 */
export function BotsOverview({ lang }: { lang: Lang }) {
  const p = discordPageTranslations[lang]
  const home = homeTranslations[lang]
  const nav = layoutTranslations[lang]
  const ticketFrom = home.bot_price_ticket.replace('{price}', formatTierPrice(cheapestPaidTier(), lang))

  const bots = [
    {
      id: 'ticket-bot',
      name: 'Ticket Bot',
      desc: home.bot_ticket_desc,
      sub: nav.nav_ticket_desc,
      price: ticketFrom,
      facts: TICKETBOT_COPY[lang].highlights,
      href: '/discord/ticket-bot',
      to: p.to_ticket,
      dashboard: '/dashboard/ticket-bot',
      stats: '/discord/ticket-bot/stats',
    },
    {
      id: 'giveaway-bot',
      name: 'Giveaway Bot',
      desc: home.bot_giveaway_desc,
      sub: nav.nav_giveaway_desc,
      price: home.bot_price_giveaway,
      facts: GIVEAWAY_COPY[lang].highlights,
      href: '/discord/giveaway-bot',
      to: p.to_giveaway,
      dashboard: '/dashboard/giveaway-bot',
      stats: '/discord/giveaway-bot/stats',
    },
  ]

  return (
    <>
      <PageHero
        id="discord-title"
        crumbs={[{ label: packagesTranslations[lang].breadcrumb_home, href: '/' }, { label: nav.nav_discord }]}
        kicker={home.bots_kicker}
        title={<BrandTitle template={p.title} />}
        lead={home.bots_subtitle}
        aside={
          <HeroLinks
            label={p.bots_label}
            links={bots.map(b => ({ href: b.href, title: b.name, sub: b.sub, price: b.price }))}
          />
        }
      />

      <div className="border-t border-[var(--color-border)] py-[var(--space-section)]">
        <div className="container-page @container">
          <div className="grid gap-x-[clamp(2rem,4cqi,6rem)] gap-y-[calc(2*var(--space-stack))] @5xl:grid-cols-2">
            {bots.map(bot => (
              <section key={bot.id} aria-labelledby={`${bot.id}-name`} className="grid content-start gap-4 border-t-2 border-[var(--color-primary)] pt-6">
                <h2 id={`${bot.id}-name`} className="font-display text-h2 font-[750] [font-stretch:112%]">
                  <Link href={bot.href} className="hover:text-[var(--color-primary)] hover:underline underline-offset-4">{bot.name}</Link>
                </h2>
                <p className="max-w-[34rem] text-lead text-[var(--color-muted-foreground)]">{bot.desc}</p>
                <p className="font-semibold tabular-nums">{bot.price}</p>
                <ul aria-label={p.highlights} className="grid gap-x-6 gap-y-1.5 @lg:grid-cols-2">
                  {bot.facts.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-[0.3em] h-4 w-4 shrink-0 text-[var(--color-success)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href={bot.href}>
                      {bot.to}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  {/* Session-dependent, may answer with redirect(): not
                      prefetched, or the router cache would replay a redirect
                      decided while signed out. */}
                  <Button asChild variant="outline">
                    <Link href={bot.dashboard} prefetch={false}>{home.bot_dashboard}</Link>
                  </Button>
                  <TextLink href={bot.stats}>{home.bot_stats}</TextLink>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
