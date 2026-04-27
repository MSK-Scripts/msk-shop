import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { getPackages } from '@/lib/tebex'
import { Hero } from '@/components/home/Hero'
import { Divider } from '@/components/home/Divider'
import { InfoSection } from '@/components/home/InfoSection'
import { CTASection } from '@/components/home/CTASection'
import { PackageCard } from '@/components/packages/PackageCard'
import { FEATURED_PACKAGE_IDS, PACKAGE_BADGES, PACKAGE_TAGS, PACKAGE_DESCRIPTIONS } from '@/lib/config'
import { CUSTOM_PACKAGES, CUSTOM_PACKAGES_TITLE } from '@/content/custom-packages'

const badgeStyles = {
  esx:        'bg-red-500/10 text-red-400 border border-red-500/25',
  qb:         'bg-purple-500/10 text-purple-400 border border-purple-500/25',
  js:         'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25',
  standalone: 'bg-accent/10 text-accent border border-accent/25',
  lua:        'bg-blue-500/10 text-blue-400 border border-blue-500/25',
}

export const revalidate = 60

export default async function HomePage() {
  const allPackages = await getPackages()
  const featured = FEATURED_PACKAGE_IDS.length > 0
    ? allPackages.filter(pkg => FEATURED_PACKAGE_IDS.includes(pkg.id))
    : allPackages

  return (
    <>
      <Hero />
      <Divider />
      <InfoSection />

      {/* Tebex Packages */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        {featured.length > 0 ? (
          <div className={featured.length < 3 ? 'max-w-2xl mx-auto' : ''}>
            <div className="flex items-baseline gap-3 py-6">
              <span className="msk-label">FiveM</span>
              <h2 className="msk-section-title">
                {FEATURED_PACKAGE_IDS.length > 0 ? 'Featured Packages' : 'All Packages'}
              </h2>
            </div>
            <div className={`grid gap-4 ${
              featured.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
              featured.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {featured.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} badges={PACKAGE_BADGES[pkg.id]} tags={PACKAGE_TAGS[pkg.id]} description={PACKAGE_DESCRIPTIONS[pkg.id]} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-dim text-sm py-8 text-center">No packages found.</p>
        )}
      </section>

      {/* Custom Packages (Discord Bots, GitHub, etc.) */}
      {CUSTOM_PACKAGES.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className={CUSTOM_PACKAGES.length < 3 ? 'max-w-2xl mx-auto' : ''}>
            <div className="flex items-baseline gap-3 py-6">
              <span className="msk-label">Github</span>
              <h2 className="msk-section-title">{CUSTOM_PACKAGES_TITLE}</h2>
            </div>
            <div className={`grid gap-4 ${
              CUSTOM_PACKAGES.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
              CUSTOM_PACKAGES.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
            {CUSTOM_PACKAGES.map(pkg => (
              <div key={pkg.id} className="msk-card flex flex-col group">
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#151a14] to-[#0f160f]">
                  {pkg.image ? (
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] text-white/10 font-mono tracking-widest">
                        {pkg.name.toLowerCase().replace(/\s+/g, '_')}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {pkg.badges.length > 0 && (
                    <div className="absolute bottom-2.5 left-3 flex gap-1.5 flex-wrap">
                      {pkg.badges.map(b => (
                        <span key={b.label} className={`msk-badge ${badgeStyles[b.variant]}`}>{b.label}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4 gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-white leading-tight">{pkg.name}</h3>
                    <span className={`text-[15px] font-bold shrink-0 ${pkg.isFree ? 'text-muted' : 'text-accent'}`}>
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{pkg.description}</p>
                  {pkg.tags && pkg.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.tags.map(tag => (
                        <span key={tag} className="text-[10px] text-dim bg-bg border border-borderlt rounded px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="pt-2 border-t border-borderlt">
                    <a
                      href={pkg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="msk-btn-primary w-full justify-center text-xs py-2.5"
                    >
                      <ExternalLink size={13} />
                      {pkg.linkLabel}
                    </a>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </>
  )
}
