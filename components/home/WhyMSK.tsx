import { HOME_FEATURE_ICONS } from '@/content/home-features'
import { homeTranslations, type Lang } from '@/lib/i18n'

/**
 * Warum MSK, in vier Karten.
 *
 * Bewusst im selben Baukasten wie `HowItWorks` direkt darüber: zentrierte
 * Überschrift, dieselbe Kartenform, dasselbe Icon-Plättchen, dieselbe
 * Spaltenzahl. Die Sektion stand vorher als linksbündige Liste mit Trennlinien
 * da und wirkte dadurch wie ein Fremdkörper zwischen zwei Kartenrastern.
 *
 * Unterschied zu `HowItWorks`: keine Ziffern. Der Kaufablauf ist eine Abfolge,
 * die vier Argumente hier sind es nicht, deshalb `<ul>` statt `<ol>`.
 *
 * Der leicht abgesetzte Hintergrund bleibt, er trennt die Sektion von den
 * Nachbarn, ohne die Bauform zu ändern.
 */
export function WhyMSK({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]

  return (
    <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
      <div className="container-page py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t.why_heading}</h2>
          <p className="mt-4 text-base text-[var(--color-muted-foreground)]">
            {t.why_subtitle}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_FEATURE_ICONS.map((Icon, i) => {
            const f = t.why_features[i]
            return (
              <li
                key={f.title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--color-primary)_15%,transparent)] text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="mb-1.5 font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {f.description}
                </p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
