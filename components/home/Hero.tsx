import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ReleaseFeed } from '@/components/home/ReleaseFeed'
import { SITE_CONFIG } from '@/lib/config'
import { homeTranslations, type Lang } from '@/lib/i18n'
import type { HeadlineStat } from '@/lib/fivestats'
import type { ReleaseEntry } from '@/lib/releases'
import { GithubMark } from '@/components/icons/GithubMark'

/**
 * Der Hero füllt bewusst den sichtbaren Bereich.
 *
 * `min-h` statt `h`: bei einem niedrigen oder stark gezoomten Fenster wächst
 * die Sektion über die Bildschirmhöhe hinaus und scrollt, statt den Inhalt zu
 * stauchen oder abzuschneiden. `100svh` statt `100vh`, weil auf dem Telefon
 * sonst die einfahrende Browserleiste mitgerechnet wird und der Hero beim
 * Scrollen springt. Die 4rem sind die Höhe des stickenden Headers
 * (`h-16` in components/layout/Header.tsx), damit hier genau der Rest steht.
 *
 * `children` ist der Platz für die Belegzeile: sie gehört optisch in den Hero,
 * bleibt aber eine eigene Komponente, weil sie eigene Datenquellen hat.
 */
export function Hero({
  lang, stat, releases, children,
}: {
  lang: Lang
  stat?: HeadlineStat | null
  releases: ReleaseEntry[]
  children?: React.ReactNode
}) {
  const t = homeTranslations[lang]

  // Mit Live-Daten die echte Zahl zeigen und aufs /resources-Dashboard
  // verlinken, damit sie nachprüfbar ist. Ohne Daten (kein API-Key, fivestats
  // nicht erreichbar) verschwindet die Zahl — der frühere Fallback behauptete
  // an dieser Stelle „über 500 Server" und ersetzte damit einen geprüften Wert
  // durch einen schlechteren.
  const liveLabel = stat
    ? t.hero_badge_live
        .replace('{resource}', stat.displayName)
        .replace('{count}', stat.serverCount.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'))
    : null

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden">
      <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

      {/* `flex-1` nimmt die Resthöhe, `items-center` zentriert beide Spalten
          darin vertikal. Auf einem hohen Fenster steht der Inhalt damit in der
          Mitte, auf einem flachen füllt er die Fläche ohne Sprung. */}
      <div className="container-page relative flex flex-1 items-center py-10 lg:py-14">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12">

          {/* Text-Spalte */}
          <div>
            {liveLabel && (
              <Link href="/resources" className="mb-6 inline-block">
                <Badge variant="outline" className="transition-colors hover:border-[var(--color-primary)]">
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  {liveLabel}
                </Badge>
              </Link>
            )}

            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t.hero_h1_line1}<br />
              {t.hero_h1_line2}<br />
              <span className="text-[var(--color-primary)]">{t.hero_h1_accent}</span>
            </h1>

            <p className="mt-6 max-w-[42ch] text-pretty text-lg text-[var(--color-muted-foreground)] md:text-xl">
              {t.hero_subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/packages">
                  {t.hero_btn_browse}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={SITE_CONFIG.github} target="_blank" rel="noopener noreferrer">
                  <GithubMark className="h-4 w-4" />
                  {t.hero_btn_github}
                </a>
              </Button>
            </div>
          </div>

          {/* Release-Protokoll statt des früheren Terminal-Mockups. Das enthielt
              einen erfundenen Benchmark („12 vehicles indexed in 42 ms"). */}
          <ReleaseFeed lang={lang} releases={releases} />
        </div>
      </div>

      {/* Belegzeile, am unteren Rand des sichtbaren Bereichs. */}
      {children}
    </section>
  )
}
