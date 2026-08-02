import Link from 'next/link'
import { MessageSquare, Gift } from 'lucide-react'
import { homeTranslations, type Lang } from '@/lib/i18n'

/**
 * The two Discord bots, with their sub-pages reachable in one click.
 *
 * They used to sit inside the generic "Tools, Bots & More" grid between seven
 * free resources, which buried two products that have their own pricing,
 * dashboards and statistics behind things that cost nothing.
 */

const BOTS = [
  {
    key: 'ticketbot',
    name: 'Ticket Bot',
    Icon: MessageSquare,
    href: '/ticketbot',
    links: [
      { key: 'verify',    href: '/ticketbot/verify' },
      { key: 'dashboard', href: '/ticketbot/dashboard' },
      { key: 'stats',     href: '/ticketbot/stats' },
    ],
  },
  {
    key: 'giveaway',
    name: 'Giveaway Bot',
    Icon: Gift,
    href: '/giveaway',
    links: [
      { key: 'dashboard', href: '/giveaway/dashboard' },
      { key: 'stats',     href: '/giveaway/stats' },
    ],
  },
] as const

export function Bots({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]

  const label = (key: string) => ({
    verify:    t.bot_verify,
    dashboard: t.bot_dashboard,
    stats:     t.bot_stats,
  } as Record<string, string>)[key] ?? key

  const description = (key: string) =>
    key === 'ticketbot' ? t.bot_ticket_desc : t.bot_giveaway_desc

  return (
    <section className="border-t border-[var(--color-border)]">
      <div className="container-page py-14 md:py-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t.bots_heading}</h2>
        <p className="mt-2 max-w-[68ch] text-sm text-[var(--color-muted-foreground)]">
          {t.bots_subtitle}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {BOTS.map(bot => (
            <div
              key={bot.key}
              className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-colors hover:border-[color-mix(in_oklab,var(--color-primary)_42%,var(--color-border))]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]">
                  <bot.Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h3 className="text-lg font-bold tracking-tight">{bot.name}</h3>
              </div>

              <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {description(bot.key)}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Link
                  href={bot.href}
                  className="rounded-full border border-[color-mix(in_oklab,var(--color-primary)_45%,var(--color-border))] px-3 py-1.5 text-[0.8125rem] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-primary)_10%,transparent)]"
                >
                  {t.bot_overview}
                </Link>
                {bot.links.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    // Session-abhängig, kann server-seitig redirect() liefern →
                    // nicht prefetchen, sonst cached der Router-Cache die
                    // Redirect-Entscheidung aus dem ausgeloggten Zustand.
                    prefetch={false}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    {label(l.key)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
