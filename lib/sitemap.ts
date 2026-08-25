import { getCategories, getPackages } from '@/lib/tebex'
import { listCategories } from '@/lib/images'
import { absoluteUrl } from '@/lib/siteUrl'
import { alternatePaths } from '@/lib/lang'

/**
 * Sitemap: Datenaufbau und Serialisierung.
 *
 * Warum von Hand und nicht über Nexts `app/sitemap.ts`: dessen Serialisierer
 * bietet keinen Platz für eine `<?xml-stylesheet?>`-Anweisung. Ohne die
 * rendert der Browser die Datei als aneinandergehängten Text, was jedes
 * Nachsehen von Hand unbrauchbar macht. Google interessiert das Stylesheet
 * nicht, es liest das XML.
 *
 * Warum hier weder `priority` noch `changefreq` steht: Google ignoriert beide
 * Felder vollständig (Search Central, „Build and Submit a Sitemap"). Sie
 * standen bis zum 22.08.2026 drin und haben nichts getan, ausser eine
 * Steuerung vorzutäuschen, die es nicht gibt.
 *
 * `lastmod` dagegen wertet Google aus, aber nur wenn der Wert „consistently and
 * verifiably accurate" ist. Vorher stand dort `new Date()` für **alle** URLs,
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

export interface SitemapEntry {
  url:           string
  lastModified?: Date
  /** hreflang → absolute URL. Leer lassen, wenn die Seite einsprachig ist. */
  alternates?:   Record<string, string>
}

/** Pfad zum XSL-Stylesheet, das den Browser die Sitemap als Tabelle zeigen lässt. */
export const SITEMAP_STYLESHEET = '/sitemap.xsl'

/** Statische, öffentlich indexierbare Seiten. */
const STATIC_ROUTES = [
  '/',
  '/packages',
  '/resources',
  '/images',
  '/ticketbot',
  '/giveaway',
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
 * Jede Seite steht zweimal in der Sitemap, einmal je Sprache, und beide
 * Einträge nennen dasselbe hreflang-Trio. Ein einseitiges oder abweichendes
 * Paar wertet Google nicht.
 *
 * Seit dem 22.08.2026 gilt das für den ganzen Baum und nicht mehr nur für die
 * beiden Bot-Landingpages: die Sprache steckt im Pfad, `/de/packages` ist eine
 * eigene Adresse mit eigenem Inhalt.
 */
function bothLanguages(path: string, lastModified?: Date): SitemapEntry[] {
  const alt = alternatePaths(path)
  const alternates = {
    'en':        absoluteUrl(alt.en),
    'de':        absoluteUrl(alt.de),
    'x-default': absoluteUrl(alt.en),
  }
  return (['en', 'de'] as const).map(lang => ({
    url: absoluteUrl(alt[lang]),
    lastModified,
    alternates,
  }))
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.flatMap(path => bothLanguages(path))

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

  const packageEntries: SitemapEntry[] = packages.flatMap(pkg =>
    bothLanguages(`/packages/${pkg.id}`, parseTimestamp(pkg.updated_at)),
  )

  // `getCategories()` fragt mit `includePackages=1` ab, die Pakete liegen also
  // vor. Eine Kategorieseite ändert sich genau dann, wenn eines ihrer Pakete
  // sich ändert.
  const categoryEntries: SitemapEntry[] = categories.flatMap(cat =>
    bothLanguages(`/categories/${cat.id}`, newest((cat.packages ?? []).map(pkg => parseTimestamp(pkg.updated_at)))),
  )

  // Galerie: Uebersicht und Kategorieseiten gehoeren hierher, die einzelnen
  // Bilder NICHT. Davon gibt es tausende, und eine Sitemap darf 50.000 URLs
  // fassen — sie stehen deshalb in `/sitemap-images.xml`, das ausserdem den
  // image-Namespace mitbringt, den Google fuer Bildersuche auswertet.
  //
  // Fail-soft wie bei Tebex: ohne Datenbank (CI-Build) bleibt die Sitemap
  // gueltig, statt den Build zu kippen.
  const imageCategories = await listCategories('en').catch(err => {
    console.warn('[sitemap] Bildkategorien nicht verfuegbar:', err)
    return []
  })

  const imageCategoryEntries: SitemapEntry[] = imageCategories
    .filter(c => c.count > 0)
    .flatMap(c => bothLanguages(`/images/${c.slug}`))

  return [...staticEntries, ...packageEntries, ...categoryEntries, ...imageCategoryEntries]
}

/**
 * Entschärft die fünf Zeichen, die in XML nicht roh in Text oder Attributwerten
 * stehen dürfen. Heute enthalten alle URLs nur Ziffern und Buchstaben, aber ein
 * Serialisierer, der sich darauf verlässt, produziert beim ersten Sonderzeichen
 * eine kaputte Datei.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const hasAlternates = entries.some(e => e.alternates && Object.keys(e.alternates).length > 0)

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<?xml-stylesheet type="text/xsl" href="${SITEMAP_STYLESHEET}"?>`,
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
      + (hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '')
      + '>',
  ]

  for (const entry of entries) {
    lines.push('<url>')
    lines.push(`<loc>${escapeXml(entry.url)}</loc>`)
    for (const [hreflang, href] of Object.entries(entry.alternates ?? {})) {
      lines.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`)
    }
    if (entry.lastModified) lines.push(`<lastmod>${entry.lastModified.toISOString()}</lastmod>`)
    lines.push('</url>')
  }

  lines.push('</urlset>')
  return lines.join('\n') + '\n'
}
