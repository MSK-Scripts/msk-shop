import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ImageCard } from '@/components/images/ImageCard'
import { GallerySearch } from '@/components/images/GallerySearch'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Button } from '@/components/ui/Button'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { imagesTranslations, type Lang } from '@/lib/i18n'
import { listImages, listCategories, DEFAULT_PER_PAGE } from '@/lib/images'

export const revalidate = 300

type Params = Promise<{ category: string }>
type Search = Promise<{ q?: string; page?: string }>

async function findCategory(slug: string, lang: Lang) {
  const categories = await listCategories(lang)
  return categories.find(c => c.slug === slug) ?? null
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category: slug } = await params
  const { lang } = await getRequestLang()
  const category = await findCategory(slug, lang)
  if (!category) return {}

  // Kuratiert wie die Paketseiten: der rohe Kategoriename ("Vehicles") ist als
  // Titel wertlos, gesucht wird nach dem, was die Bilder sind.
  const title = lang === 'de'
    ? `${category.name} Bilder für FiveM`
    : `FiveM ${category.name} Images`
  const description = lang === 'de'
    ? `${category.count} freigestellte ${category.name}-Bilder aus GTA V, benannt nach dem Spawnnamen. Kostenlos für FiveM-Scripts, ausgeliefert über unser CDN.`
    : `${category.count} transparent GTA V ${category.name.toLowerCase()} images, named by spawn name. Free for FiveM scripts, served from our CDN.`

  return { title, description, alternates: alternatesFor(lang, `/images/${slug}`) }
}

export default async function CategoryPage(
  { params, searchParams }: { params: Params; searchParams: Search },
) {
  const { category: slug } = await params
  const { q = '', page: rawPage = '1' } = await searchParams
  const { lang } = await getRequestLang()
  const t = imagesTranslations[lang]

  const category = await findCategory(slug, lang)
  if (!category) notFound()

  const page = Math.max(1, Number(rawPage) || 1)
  const result = await listImages({ category: slug, q, page, per: DEFAULT_PER_PAGE })
  const pages  = Math.max(1, Math.ceil(result.total / result.per))

  const num = (n: number) => new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US').format(n)

  // Der Seitenzustand steht in der URL, damit jede Filterkombination teilbar
  // ist und der Zurueck-Knopf funktioniert. Die Links unten bauen ihn wieder
  // zusammen, statt ihn in einem State zu halten.
  const hrefFor = (p: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const query = sp.toString()
    return `/images/${slug}${query ? `?${query}` : ''}`
  }

  return (
    <div className="container-page py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-4 font-mono text-xs text-[var(--color-muted-foreground)]">
        <Link href="/images" className="hover:text-[var(--color-primary)]">
          {t.title}
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-[var(--color-foreground)]">{category.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{category.name}</h1>
        <p className="mt-2 font-mono text-xs text-[var(--color-muted-foreground)]">
          {num(category.count)} {t.count_images}
        </p>
      </header>

      <section aria-labelledby="filters-heading" className="mb-8">
        <h2 id="filters-heading" className="sr-only">{t.filters_title}</h2>
        <GallerySearch lang={lang} slug={slug} initialQuery={q} />
      </section>

      <section aria-labelledby="gallery-heading">
        <h2 id="gallery-heading" className="sr-only">{t.gallery_title}</h2>

        {/* Die Trefferzahl aendert sich nach jeder Suche und stand sonst nur
            still da. role="status" macht sie fuer einen Screenreader hoerbar. */}
        <p role="status" className="mb-4 font-mono text-xs text-[var(--color-muted-foreground)]">
          {t.results.replace('{shown}', num(result.items.length)).replace('{total}', num(result.total))}
        </p>

        {result.items.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center">
            <p className="font-bold">{q ? t.no_results : t.empty_category}</p>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {q ? t.no_results_hint : t.empty_hint}
            </p>
            {q && (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href={`/images/${slug}`}>{t.clear_search}</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr))]">
            {result.items.map((image, i) => (
              <ImageCard key={image.name} image={image} priority={i < 12} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
            <Button asChild variant="outline" size="sm" disabled={page <= 1}>
              <Link href={hrefFor(page - 1)} aria-disabled={page <= 1}>{t.page_prev}</Link>
            </Button>
            <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
              {t.page_of.replace('{page}', num(page)).replace('{pages}', num(pages))}
            </span>
            <Button asChild variant="outline" size="sm" disabled={page >= pages}>
              <Link href={hrefFor(page + 1)} aria-disabled={page >= pages}>{t.page_next}</Link>
            </Button>
          </nav>
        )}
      </section>
    </div>
  )
}
