import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { getCategory, getCategories } from '@/lib/tebex'
import { PackageCard } from '@/components/packages/PackageCard'
import { Button } from '@/components/ui/Button'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS, CATEGORY_SEO } from '@/lib/config'
import { sanitizeTebexHtml } from '@/lib/sanitize'
import { DEFAULT_OG_IMAGE, openGraphFor, plainExcerpt } from '@/lib/seo'
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
  const { id } = await params

  try {
    const cat = await getCategory(id)
    const canonical = `/categories/${cat.id}`
    const count = cat.packages?.length ?? 0
    const snippet = CATEGORY_SEO[cat.id]

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
      alternates: { canonical },
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
    return { title: 'Category', alternates: { canonical: `/categories/${id}` } }
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let category
  try {
    category = await getCategory(id)
  } catch {
    notFound()
  }

  const packageCount = category.packages?.length ?? 0

  return (
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
        <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/packages" className="transition-colors hover:text-[var(--color-foreground)]">Packages</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--color-foreground)]">{category.name}</span>
      </nav>

      <header className="mb-10">
        <span className="eyebrow">Resources</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{category.name}</h1>
        {category.description && (
          <div
            className="tebex-description mt-3 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: sanitizeTebexHtml(category.description) }}
          />
        )}
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          {packageCount} {packageCount === 1 ? 'package' : 'packages'} in this category
        </p>
      </header>

      {category.packages && category.packages.length > 0 ? (
        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
          {category.packages.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              badges={PACKAGE_BADGES[pkg.id]}
              tags={PACKAGE_TAGS[pkg.id]}
              description={PACKAGE_DESCRIPTIONS[pkg.id]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
          <p className="text-lg font-semibold">No packages in this category yet.</p>
          <Button asChild>
            <Link href="/packages">
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
