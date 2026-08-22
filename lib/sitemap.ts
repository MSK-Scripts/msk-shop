import { BOT_LANDING_PATHS } from '@/lib/botSeo'
import { getCategories, getPackages } from '@/lib/tebex'
import { absoluteUrl } from '@/lib/siteUrl'

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
 * Eintrag nennt beide Fassungen plus `x-default`, damit die Sitemap dieselben
 * hreflang-Angaben trägt wie das HTML. Ein einseitiges oder abweichendes Paar
 * wertet Google nicht.
 */
function botLandingEntries(): SitemapEntry[] {
  return Object.values(BOT_LANDING_PATHS).flatMap(paths =>
    (['en', 'de'] as const).map(lang => ({
      url: absoluteUrl(paths[lang]),
      alternates: {
        'en':        absoluteUrl(paths.en),
        'de':        absoluteUrl(paths.de),
        'x-default': absoluteUrl(paths.en),
      },
    })),
  )
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.map(path => ({ url: absoluteUrl(path) }))

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

  const packageEntries: SitemapEntry[] = packages.map(pkg => ({
    url:          absoluteUrl(`/packages/${pkg.id}`),
    lastModified: parseTimestamp(pkg.updated_at),
  }))

  // `getCategories()` fragt mit `includePackages=1` ab, die Pakete liegen also
  // vor. Eine Kategorieseite ändert sich genau dann, wenn eines ihrer Pakete
  // sich ändert.
  const categoryEntries: SitemapEntry[] = categories.map(cat => ({
    url:          absoluteUrl(`/categories/${cat.id}`),
    lastModified: newest((cat.packages ?? []).map(pkg => parseTimestamp(pkg.updated_at))),
  }))

  return [...staticEntries, ...botLandingEntries(), ...packageEntries, ...categoryEntries]
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
