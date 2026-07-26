import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { getPackage, getPackages } from '@/lib/tebex'
import { AddToCartButton } from '@/components/packages/AddToCartButton'
import { PackageGallery } from '@/components/packages/PackageGallery'
import { PackagePrice } from '@/components/packages/PackagePrice'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'
import { sanitizeTebexHtml } from '@/lib/sanitize'
import type { BadgeVariant } from '@/components/ui/Badge'

export const revalidate = 60

export async function generateStaticParams() {
  // Fail-soft: ist die Tebex-API zur Build-Zeit nicht erreichbar/autorisiert
  // (z. B. CI-Builds ohne Secrets wie bei Dependabot-PRs), wird kein Prerender
  // erzeugt — die Seiten rendern weiterhin on-demand.
  try {
    const packages = await getPackages()
    return packages.map(pkg => ({ id: String(pkg.id) }))
  } catch (err) {
    console.warn('[packages/[id]] generateStaticParams: Tebex nicht verfügbar, Prerender übersprungen:', err)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pkg = await getPackage(id)
    return { title: `${pkg.name} | MSK Scripts Shop` }
  } catch {
    return { title: 'Package | MSK Scripts Shop' }
  }
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let pkg
  try {
    pkg = await getPackage(id)
  } catch {
    notFound()
  }

  const basePrice = pkg.base_price ?? 0
  const totalPrice = pkg.total_price ?? basePrice
  const configBadges = PACKAGE_BADGES[pkg.id]
  const configTags = PACKAGE_TAGS[pkg.id]
  const configDescription = PACKAGE_DESCRIPTIONS[pkg.id]

  return (
    <div className="container-page py-10 md:py-14">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/packages" className="transition-colors hover:text-[var(--color-foreground)]">Packages</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--color-foreground)]">{pkg.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* Left: Hero-Image + Description */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <PackageGallery
              media={pkg.media}
              image={pkg.image}
              alt={pkg.name}
              overlay={
                configBadges && configBadges.length > 0 ? (
                  <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5">
                    {configBadges.map(b => (
                      <Badge key={b.label} variant={b.variant as BadgeVariant}>{b.label}</Badge>
                    ))}
                  </div>
                ) : null
              }
            />

            <div className="p-6 md:p-8">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {pkg.type === 'subscription' && (
                  <Badge variant="primary">Subscription</Badge>
                )}
              </div>

              <h1 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">{pkg.name}</h1>

              {configDescription && (
                <p className="mb-6 text-base text-[var(--color-muted-foreground)]">
                  {configDescription}
                </p>
              )}

              {configTags && configTags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-1.5">
                  {configTags.map(tag => (
                    <span
                      key={tag}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="my-6 h-px bg-[var(--color-border)]" />

              <div
                className="tebex-description"
                dangerouslySetInnerHTML={{ __html: sanitizeTebexHtml(pkg.description) }}
              />
            </div>
          </Card>
        </div>

        {/* Right: Purchase sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 p-6">
            <h2 className="mb-4 border-b border-[var(--color-border)] pb-3 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
              Purchase
            </h2>

            <div className="mb-6">
              <PackagePrice
                packageId={pkg.id}
                basePrice={basePrice}
                totalPrice={totalPrice}
                currency={pkg.currency ?? 'EUR'}
              />
              <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                Incl. VAT · Instant delivery
              </p>
            </div>

            <AddToCartButton pkg={pkg} />

            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link href="/packages">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Packages
              </Link>
            </Button>
          </Card>
        </div>

      </div>
    </div>
  )
}
