import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ReleaseFeed } from '@/components/home/ReleaseFeed'
import { SITE_CONFIG } from '@/lib/config'
import { homeTranslations, type Lang } from '@/lib/i18n'
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
  lang, releases, children,
}: {
  lang: Lang
  releases: ReleaseEntry[]
  children?: React.ReactNode
}) {
  const t = homeTranslations[lang]

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden">
      <div aria-hidden className="hero-decor-gradient pointer-events-none absolute inset-0" />

      {/* `flex-1` nimmt die Resthöhe, `items-center` zentriert beide Spalten
          darin vertikal. Auf einem hohen Fenster steht der Inhalt damit in der
          Mitte, auf einem flachen füllt er die Fläche ohne Sprung. */}
      <div className="container-page relative flex flex-1 items-center py-10 lg:py-14">
        {/* Both columns carry their own cap and the pair is centred, instead of
            each taking a share of the row. The old 1.06fr/0.94fr split gave the
            text column 896 px at 1854 px while the text inside used about
            515 px, and that leftover showed up as a ~450 px hole in the middle
            of the hero. Letting the feed absorb it instead only moved the
            problem: the feed grew to 1156 px and its rows pulled apart.
            Capping both and centring the group keeps each block at its natural
            size and closes the gap to the 48 px gutter. `minmax(0, …)` so the
            columns still give way between `lg` and the point where both caps
            fit; below `lg` the grid is single-column and none of this applies. */}
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,34rem)_minmax(0,50rem)] lg:justify-center lg:gap-12">

          {/* Text-Spalte */}
          <div>
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
