import { getPackages, getCategories } from '@/lib/tebex'
import { PackageCard } from '@/components/packages/PackageCard'

export const revalidate = 60

export default async function PackagesPage() {
  const packages = await getPackages()

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <span className="msk-label">Store</span>
        <h1 className="text-3xl font-extrabold text-white mt-1 mb-2">All Packages</h1>
        <p className="text-muted text-sm">
          {packages.length} package{packages.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-20 text-dim">
          <p className="text-lg font-semibold mb-2">No packages yet</p>
          <p className="text-sm">Check back soon!</p>
        </div>
      )}
    </div>
  )
}
