import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { getCategory, getCategories } from '@/lib/tebex'
import { PackageCard } from '@/components/packages/PackageCard'
import { Button } from '@/components/ui/Button'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS, CATEGORY_SEO, resolveVariant } from '@/lib/config'
import { sanitizeTebexHtml, pickLanguageBlock } from '@/lib/sanitize'
import { categoriesTranslations, packagesTranslations } from '@/lib/i18n'
import { getRequestLang } from '@/lib/serverLang'
import { alternatesFor, DEFAULT_OG_IMAGE, openGraphFor, plainExcerpt } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { breadcrumbJsonLd } from '@/lib/jsonLd'

export const revalidate = 60

export async function generateStaticParams() {
  // Fail-soft: ist die Tebex-API zur Build-Zeit nicht erreichbar/autorisiert
  // (z. B. CI-Builds ohne Secrets wie bei Dependabot-PRs), wird kein Prerender
  // erzeugt — die Seiten rendern weiterhin on-demand. Verhindert, dass der
  // gesamte Build an der Storefront-API scheitert.
  try {
    const categories = await getCategories()
    return categories.map(cat => ({ id: String(cat.id) }))
  } catch (err) {
    console.warn('[categories/[id]] generateStaticParams: Tebex nicht verfügbar, Prerender übersprungen:', err)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const [{ id }, { lang }] = await Promise.all([params, getRequestLang()])

  try {
    const cat = await getCategory(id)
    const canonical = `/categories/${cat.id}`
    const count = cat.packages?.length ?? 0
    const snippet = CATEGORY_SEO[cat.id]?.[lang]

    // `plainExcerpt(cat.description)` liefert bei diesen Kategorien den
    // **deutschen** Teil, weil die Tebex-Texte als [GER]-Block beginnen und
    // erst danach [ENG] folgt. Auf einer englischen Seite ist das falsch,
    // deshalb hat das kuratierte Snippet Vorrang.
    const description =
      snippet?.description ||
      plainExcerpt(cat.description) ||
      `Browse ${count} ${count === 1 ? 'package' : 'packages'} in ${cat.name} from MSK Scripts.`
    const title = snippet?.title ?? cat.name

    return {
      title,
      description,
      alternates: alternatesFor(lang, canonical),
      openGraph: openGraphFor({
        url:   canonical,
        title,
        description,
      }),
      twitter: {
        card:  'summary_large_image',
        title,
        description,
        images: [DEFAULT_OG_IMAGE],
      },
    }
  } catch {
    return { title: 'Category', alternates: alternatesFor(lang, `/categories/${id}`) }
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Diese Seite hat bis zum 22.08.2026 gar keine Sprache aufgeloest: sie erbte
  // `lang="de"` aus dem Root-Layout und lieferte darunter jeden Text auf
  // Englisch. Aufloesung jetzt wie in `app/packages/page.tsx`.
  const [{ lang }, category] = await Promise.all([
    getRequestLang(),
    getCategory(id).catch(() => null),
  ])
  if (!category) notFound()

  const t = categoriesTranslations[lang]
  // Nur auf den beiden Varianten-Kategorien: dort erklaert der Hinweis, dass
  // es dasselbe Script auch in der anderen Fassung gibt.
  const showVariantNote = resolveVariant({ category: { id: Number(id) } }) !== null

  const packageCount = category.packages?.length ?? 0
  const countLabel = (packageCount === 1 ? t.count_one : t.count_many)
    .replace('{n}', packageCount.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'))

  return (
    // `container-page` wie `/packages`: beide Routen sind reine Kartenraster,
    // und DESIGN.md nennt den breiten Container genau dafuer. Beim
    // Container-Aufraeumen am 22.08. war diese Seite uebersehen worden.
    <div className="container-page py-10 md:py-14">
      {/* Muss mit der sichtbaren Breadcrumb darunter übereinstimmen. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home',     path: '/' },
          { name: 'Packages', path: '/packages' },
          { name: category.name },
        ])}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">{t.breadcrumb_home}</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/packages" className="transition-colors hover:text-[var(--color-foreground)]">{t.breadcrumb_packages}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--color-foreground)]">{category.name}</span>
      </nav>

      {/* Kein Eyebrow mehr: die Seite hat genau einen Abschnitt, das Wort
          verdoppelte die Navigationsgruppe und trug keine Information.
          DESIGN.md rationiert das Element auf hoechstens eins pro drei
          Abschnitten. */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{category.name}</h1>
        {category.description && (
          <div
            className="tebex-description mt-3 max-w-3xl"
            dangerouslySetInnerHTML={{
              // Die Tebex-Texte pflegen beide Sprachen in einem HTML als
              // [GER]-Block gefolgt von [ENG]. Ohne den Schnitt stehen sie
              // untereinander auf der Seite.
              __html: sanitizeTebexHtml(pickLanguageBlock(category.description, lang)),
            }}
          />
        )}
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{countLabel}</p>

        {showVariantNote && (
          <p className="mt-4 max-w-3xl rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
            {packagesTranslations[lang].variant_note}
          </p>
        )}
      </header>

      {category.packages && category.packages.length > 0 ? (
        <section aria-labelledby="category-results-heading">
          {/* Nur für Screenreader: die Seite sprang von H1 auf die H3 der
              Karten. Sichtbar wäre die Überschrift eine Doppelung, der
              Kategoriename steht schon als H1 darüber. */}
          <h2 id="category-results-heading" className="sr-only">{t.region_results}</h2>
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {category.packages.map(pkg => (
              <PackageCard
                key={pkg.id}
                lang={lang}
                pkg={pkg}
                badges={PACKAGE_BADGES[pkg.id]}
                tags={PACKAGE_TAGS[pkg.id]}
                description={PACKAGE_DESCRIPTIONS[pkg.id]}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
          <p className="text-lg font-semibold">{t.none_title}</p>
          <Button asChild>
            <Link href="/packages">
              <ArrowLeft className="h-4 w-4" />
              {t.back_to_shop}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
