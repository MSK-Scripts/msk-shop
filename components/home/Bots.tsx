import Image from 'next/image'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { MessageSquare, Gift, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { homeTranslations, type Lang } from '@/lib/i18n'

/**
 * The two Discord bots, with their sub-pages reachable in one click.
 *
 * They used to sit inside the generic "Tools, Bots & More" grid between seven
 * free resources, which buried two products that have their own pricing,
 * dashboards and statistics behind things that cost nothing.
 *
 * The cards carry a banner, in the same anatomy as the free scripts below:
 * image, gradient, then the text block. Without one the two products were the
 * only section on the page made of nothing but text, so they read as a
 * footnote between the banner grid below them and the illustrated sections
 * above. The markup is not shared with `CustomPackageCard` on purpose — that
 * card ends in external link buttons, these end in internal navigation pills,
 * and the pills are the whole reason this section exists.
 */

/**
 * A bot without an `image` renders the icon on a tinted panel instead. Drop a
 * file into `public/` and name it here to give it a banner; 1920x1080 matches
 * the free-script banners and is what the aspect ratio below is cut for.
 */
interface BotEntry {
  key: string
  name: string
  /** Shown on the panel when `image` is empty. */
  Icon: LucideIcon
  /** Path under `public/`, or '' for the icon fallback. */
  image: string
  href: string
  links: { key: string; href: string }[]
}

// Typed rather than `as const`: with literal types both images are provably
// non-empty, TypeScript narrows the fallback branch to `never` and reports it
// as dead code. It is not dead, it is what a third bot without a banner gets.
const BOTS: BotEntry[] = [
  {
    key: 'ticketbot',
    name: 'Ticket Bot',
    Icon: MessageSquare,
    image: '/msk-ticket-bot-banner.webp',
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
    image: '/msk-giveaway-bot-banner.webp',
    href: '/giveaway',
    links: [
      { key: 'dashboard', href: '/giveaway/dashboard' },
      { key: 'stats',     href: '/giveaway/stats' },
    ],
  },
]

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

        {/* Ab xl gedeckelt statt voll ausgereizt. Zwei Spalten in 1814 px
            Inhaltsbreite ergeben 895 px breite Karten, und ein Banner darin ist
            doppelt so gross wie die der Scripts darunter. Der Deckel bringt die
            Karte auf 588 px, also in die Groessenordnung der Sektion darunter,
            ohne eine leere dritte Rasterspalte zu erfinden. Die Ueberschrift und
            der Fliesstext darueber laufen ohnehin schmaler. */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:max-w-[75rem]">
          {BOTS.map(bot => (
            <Card key={bot.key} hoverLift className="group flex flex-col overflow-hidden">
              {/* Dieselbe feste Hoehe wie `CustomPackageCard` darunter, damit
                  beide Sektionen dieselbe Bildzeile haben. Mit dem Rasterdeckel
                  oben bleiben davon 58 % der Banner-Hoehe stehen, genug fuer
                  Logo, Wortmarke und Chip-Reihe. Ungedeckelt waeren es 38 % und
                  das Logo waere unten angeschnitten. */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))] to-[color-mix(in_oklab,var(--color-primary)_2%,var(--color-card))]">
                {bot.image ? (
                  <Image
                    src={bot.image}
                    alt=""
                    fill
                    // Gemessen, nicht geraten: eine Spalte unter dem
                    // md-Breakpoint, darueber die halbe Breite, und ab xl greift
                    // der Rasterdeckel, wodurch die Karte nie breiter als 588 px
                    // wird. Ein pauschales "960px" liess den Browser w=1080 fuer
                    // einen 589-px-Platz holen, dieselbe Ueberanforderung wie
                    // frueher bei den Paketkarten mit "33vw".
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 588px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <bot.Icon className="h-6 w-6 text-[color-mix(in_oklab,var(--color-foreground)_22%,transparent)]" aria-hidden />
                    <span className="font-mono text-2xl font-semibold tracking-wider text-[color-mix(in_oklab,var(--color-foreground)_18%,transparent)]">
                      {bot.name.toLowerCase().replace(/\s+/g, '_')}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                {/* A banner this size that does not react to a click is a trap,
                    so it leads to the overview page. Hidden from the
                    accessibility tree and the tab order because the "Overview"
                    pill below already is that link, and one card should not
                    offer the same destination twice. */}
                <Link
                  href={bot.href}
                  aria-hidden
                  tabIndex={-1}
                  className="absolute inset-0 z-10"
                />
              </div>

              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <CardTitle className="text-lg">{bot.name}</CardTitle>
                <CardDescription>{description(bot.key)}</CardDescription>

                {/* Dieselben Button-Primitive wie die Karten darunter, statt der
                    frueheren Umriss-Pillen: die Sektion sah dadurch aus, als
                    haette sie gar keine Handlungsaufforderung. Die Uebersicht ist
                    die primaere, der Rest fuehrt tiefer in den jeweiligen Bot. */}
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Button asChild size="sm" className="tap-target">
                    <Link href={bot.href}>{t.bot_overview}</Link>
                  </Button>
                  {bot.links.map(l => (
                    <Button asChild key={l.href} size="sm" variant="outline" className="tap-target">
                      <Link
                        href={l.href}
                        // Session-abhängig, kann server-seitig redirect() liefern →
                        // nicht prefetchen, sonst cached der Router-Cache die
                        // Redirect-Entscheidung aus dem ausgeloggten Zustand.
                        prefetch={false}
                      >
                        {label(l.key)}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
