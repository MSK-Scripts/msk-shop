import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getPackage, getPackages } from '@/lib/tebex'
import { AddToCartButton } from '@/components/packages/AddToCartButton'
import { PackagePrice } from '@/components/packages/PackagePrice'

export const revalidate = 60

export async function generateStaticParams() {
  const packages = await getPackages()
  return packages.map((pkg) => ({ id: String(pkg.id) }))
}

// Next.js 15: params is a Promise
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pkg = await getPackage(id)
    return { title: `${pkg.name} — MSK Scripts Shop` }
  } catch {
    return { title: 'Package — MSK Scripts Shop' }
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-dim mb-6">
        <Link href="/" className="hover:text-muted transition-colors">Home</Link>
        <span>/</span>
        <Link href="/packages" className="hover:text-muted transition-colors">Packages</Link>
        <span>/</span>
        <span className="text-muted">{pkg.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Detail */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-borderlt rounded-xl overflow-hidden">
            <div className="relative h-64 bg-gradient-to-br from-[#151a14] to-[#0f160f]">
              {pkg.image ? (
                <Image
                  src={pkg.image}
                  alt={pkg.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-white/10 font-mono tracking-widest">
                    {pkg.name.toLowerCase().replace(/\s+/g, '_')}
                  </span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl font-extrabold text-white">{pkg.name}</h1>
                <PackagePrice
                  packageId={pkg.id}
                  basePrice={basePrice}
                  totalPrice={totalPrice}
                  currency={pkg.currency ?? 'EUR'}
                />
              </div>

              <div className="flex gap-2 mb-5">
                {pkg.type === 'subscription' && (
                  <span className="msk-badge bg-blue-500/10 text-blue-400 border border-blue-500/25">
                    Subscription
                  </span>
                )}
              </div>

              <div
                className="tebex-description"
                dangerouslySetInnerHTML={{ __html: pkg.description }}
              />
            </div>
          </div>
        </div>

        {/* Right: Purchase sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-borderlt rounded-xl p-5 sticky top-20">
            <h2 className="text-sm font-bold text-white mb-4 pb-3 border-b border-borderlt">
              Purchase
            </h2>

            <div className="mb-5">
              <PackagePrice
                packageId={pkg.id}
                basePrice={basePrice}
                totalPrice={totalPrice}
                currency={pkg.currency ?? 'EUR'}
              />
            </div>

            <AddToCartButton pkg={pkg} />

            <Link href="/packages" className="msk-btn-ghost w-full justify-center mt-3 text-xs">
              ← Back to Packages
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
