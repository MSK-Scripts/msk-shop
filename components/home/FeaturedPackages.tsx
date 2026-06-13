import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getPackages } from '@/lib/tebex'
import { PackageCard } from '@/components/packages/PackageCard'
import { FEATURED_PACKAGE_IDS, PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'

export async function FeaturedPackages() {
  // Fail-soft: ist die Tebex-API zur Build-Zeit nicht erreichbar/autorisiert
  // (z. B. CI-Builds ohne Secrets wie bei Dependabot-PRs), wird die Sektion
  // ausgeblendet statt den ganzen Build/Prerender zu sprengen.
  const allPackages = await getPackages().catch(err => {
    console.warn('[FeaturedPackages] Tebex nicht verfügbar, Sektion ausgeblendet:', err)
    return []
  })
  const featured = FEATURED_PACKAGE_IDS.length > 0
    ? allPackages.filter(pkg => FEATURED_PACKAGE_IDS.includes(pkg.id))
    : allPackages

  if (featured.length === 0) {
    return null
  }

  const heading = FEATURED_PACKAGE_IDS.length > 0 ? 'Featured Packages' : 'All Packages'

  return (
    <section className="container-page py-16 md:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">FiveM</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {heading}
          </h2>
        </div>
        <Link
          href="/packages"
          prefetch={true}
          className="hidden items-center gap-1 text-sm font-medium text-[var(--color-primary)] transition-colors hover:underline sm:inline-flex"
        >
          All packages
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map(pkg => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            badges={PACKAGE_BADGES[pkg.id]}
            tags={PACKAGE_TAGS[pkg.id]}
            description={PACKAGE_DESCRIPTIONS[pkg.id]}
          />
        ))}
      </div>
    </section>
  )
}
