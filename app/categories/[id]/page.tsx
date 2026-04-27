import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategory, getCategories } from '@/lib/tebex'
import { PackageCard } from '@/components/packages/PackageCard'
import { PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'

export const revalidate = 60

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((cat) => ({ id: String(cat.id) }))
}

// Next.js 15: params is a Promise
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cat = await getCategory(id)
    return { title: `${cat.name} — MSK Scripts Shop` }
  } catch {
    return { title: 'Category — MSK Scripts Shop' }
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <nav className="flex items-center gap-2 text-xs text-dim mb-6">
        <Link href="/" className="hover:text-muted transition-colors">Home</Link>
        <span>/</span>
        <span className="text-muted">{category.name}</span>
      </nav>

      <div className="mb-6">
        <span className="msk-label">Resources</span>
        <h1 className="text-3xl font-extrabold text-white mt-1 mb-2">{category.name}</h1>
        {category.description && (
          <div
            className="text-sm text-muted"
            dangerouslySetInnerHTML={{ __html: category.description }}
          />
        )}
      </div>

      {category.packages && category.packages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} badges={PACKAGE_BADGES[pkg.id]} tags={PACKAGE_TAGS[pkg.id]} description={PACKAGE_DESCRIPTIONS[pkg.id]} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-dim">No packages in this category yet.</p>
          <Link href="/" className="msk-btn-primary inline-flex mt-4 text-sm">
            ← Back to Shop
          </Link>
        </div>
      )}
    </div>
  )
}
