import { getPackages } from '@/lib/tebex'
import { PackageCard } from '@/components/packages/PackageCard'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'

export const revalidate = 60

export const metadata = {
  title:       'All Packages',
  description: 'Browse all FiveM resources, tools and Discord bots from MSK Scripts.',
}

export default async function PackagesPage() {
  const packages = await getPackages()

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10">
        <span className="eyebrow">Store</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">All Packages</h1>
        <p className="mt-3 text-base text-[var(--color-muted-foreground)]">
          {packages.length} {packages.length === 1 ? 'package' : 'packages'} available — all prices include VAT.
        </p>
      </header>

      {packages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
          <p className="text-lg font-semibold">No packages yet</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              badges={PACKAGE_BADGES[pkg.id]}
              tags={PACKAGE_TAGS[pkg.id]}
              description={PACKAGE_DESCRIPTIONS[pkg.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
