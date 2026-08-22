import type { MetadataRoute } from 'next'

import { BOT_LANDING_PATHS } from '@/lib/botSeo'
import { getCategories, getPackages } from '@/lib/tebex'
import { absoluteUrl } from '@/lib/siteUrl'

// Die Sitemap zieht ihre dynamischen Einträge aus der Tebex-API. Gleiche
// Revalidierung wie die Katalogseiten, damit neue Pakete zeitnah drin stehen.
export const revalidate = 3600

/**
 * Warum hier weder `priority` noch `changefreq` steht:
 *
 * Google ignoriert beide Felder vollständig (Search Central, „Build and Submit
 * a Sitemap"). Sie standen bis zum 22.08.2026 drin und haben nichts getan,
 * ausser eine Steuerung vorzutäuschen, die es nicht gibt.
 *
 * `lastmod` dagegen wertet Google aus, aber nur wenn der Wert „consistently and
 * verifiably accurate" ist. Vorher stand hier `new Date()` für **alle** URLs,
 * der Wert wanderte also mit jeder Revalidierung weiter und sagte nichts über
 * die Seite aus. Jetzt gilt:
 *
 *   - Paketseiten     → `updated_at` aus der Tebex-API, der echte Wert
 *   - Kategorieseiten → das jüngste `updated_at` ihrer Pakete
 *   - alles Statische → **gar kein** `lastmod`
 *
 * Kein Datum ist besser als ein falsches: fehlt es, nutzt Google es einfach
 * nicht. Ist es erkennbar erfunden, verliert die ganze Datei ihre Glaubwürdigkeit.
 */

/** Statische, öffentlich indexierbare Seiten. */
const STATIC_ROUTES = [
  '/',
  '/packages',
  '/resources',
  // /ticketbot und /giveaway kommen aus botLandingEntries(), weil sie
  // zweisprachig sind und hreflang-Alternates brauchen.
  '/ticketbot/stats',
  '/giveaway/stats',
  '/terms',
  '/terms/imprint',
  '/terms/privacy',
]

/**
 * Parst einen Tebex-Zeitstempel defensiv. Fehlt er oder ist er unbrauchbar,
 * kommt `undefined` zurück und der Eintrag bekommt kein `lastmod` — siehe die
 * Begründung oben. `created_at` liefert die API für manche Pakete bereits als
 * `null`, auf `updated_at` ist deshalb kein Verlass ohne Prüfung.
 */
function parseTimestamp(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Jüngstes Datum einer Liste, oder `undefined` wenn keins brauchbar ist. */
function newest(dates: Array<Date | undefined>): Date | undefined {
  const usable = dates.filter((d): d is Date => d !== undefined)
  if (usable.length === 0) return undefined
  return usable.reduce((a, b) => (a > b ? a : b))
}

/**
 * Die beiden Bot-Landingpages gibt es zweisprachig unter eigenen URLs. Jeder
 * Eintrag nennt beide Fassungen plus `x-default` über `alternates.languages`,
 * damit die Sitemap dieselben hreflang-Angaben trägt wie das HTML. Ein
 * einseitiges oder abweichendes Paar wertet Google nicht.
 */
function botLandingEntries(): MetadataRoute.Sitemap {
  return Object.values(BOT_LANDING_PATHS).flatMap(paths =>
    (['en', 'de'] as const).map(lang => ({
      url: absoluteUrl(paths[lang]),
      alternates: {
        languages: {
          'en':        absoluteUrl(paths.en),
          'de':        absoluteUrl(paths.de),
          'x-default': absoluteUrl(paths.en),
        },
      },
    })),
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(path => ({
    url: absoluteUrl(path),
  }))

  // Fail-soft: Ist Tebex nicht erreichbar (CI-Build ohne Secrets, API-Ausfall),
  // wird trotzdem eine gültige Sitemap mit den statischen Seiten ausgeliefert,
  // statt den ganzen Build zu kippen.
  const [packages, categories] = await Promise.all([
    getPackages().catch(err => {
      console.warn('[sitemap] Tebex-Pakete nicht verfügbar:', err)
      return []
    }),
    getCategories().catch(err => {
      console.warn('[sitemap] Tebex-Kategorien nicht verfügbar:', err)
      return []
    }),
  ])

  const packageEntries: MetadataRoute.Sitemap = packages.map(pkg => ({
    url:          absoluteUrl(`/packages/${pkg.id}`),
    lastModified: parseTimestamp(pkg.updated_at),
  }))

  // `getCategories()` fragt mit `includePackages=1` ab, die Pakete liegen also
  // vor. Eine Kategorieseite ändert sich genau dann, wenn eines ihrer Pakete
  // sich ändert.
  const categoryEntries: MetadataRoute.Sitemap = categories.map(cat => ({
    url:          absoluteUrl(`/categories/${cat.id}`),
    lastModified: newest((cat.packages ?? []).map(pkg => parseTimestamp(pkg.updated_at))),
  }))

  return [...staticEntries, ...botLandingEntries(), ...packageEntries, ...categoryEntries]
}
