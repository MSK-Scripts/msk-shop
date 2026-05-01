'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Loader2, LogIn } from 'lucide-react'
import { useCart } from '@/lib/useCart'
import { useSalePricesStore } from '@/store/salePrices'
import type { Badge, BadgeVariant } from '@/lib/config'
import type { TebexPackage } from '@/types/tebex'

interface Props {
  pkg: TebexPackage
  tags?: string[]
  badges?: Badge[]
  description?: string
}

const badgeStyles = {
  esx:        'bg-[#F7941D]/10 text-[#F7941D] border border-[#F7941D]/25',
  qb:         'bg-purple-500/10 text-purple-400 border border-purple-500/25',
  js:         'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25',
  standalone: 'bg-accent/10 text-accent border border-accent/25',
  lua:        'bg-blue-500/10 text-blue-400 border border-blue-500/25',
  py:         'bg-sky-500/10 text-sky-400 border border-sky-500/25',
  discord:    'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25',
  fivem:      'bg-orange-500/10 text-orange-400 border border-orange-500/25',
}

export function PackageCard({ pkg, tags, badges, description }: Props) {
  const { addPackage, isLoading, username } = useCart()
  const { prices } = useSalePricesStore()

  // Use sale prices from store if available (fetched with basket ident after login)
  const saleData = prices[pkg.id]
  const basePrice = saleData?.base_price ?? pkg.base_price ?? 0
  const totalPrice = saleData?.total_price ?? pkg.total_price ?? basePrice
  const hasDiscount = totalPrice < basePrice && basePrice > 0
  const isFree = basePrice === 0
  const needsLogin = !username && !isFree

  return (
    <div className="msk-card flex flex-col group">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#151a14] to-[#0f160f]">
        {pkg.image ? (
          <Image src={pkg.image} alt={pkg.name} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] text-white/10 font-mono tracking-widest">
              {pkg.name.toLowerCase().replace(/\s+/g, '_')}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Sale badge — top right */}
        {hasDiscount && (
          <div className="absolute top-2.5 right-3">
            <span className="msk-badge bg-red-600/15 text-red-500 border border-red-600/30">Sale</span>
          </div>
        )}
        {/* Other badges — bottom left */}
        <div className="absolute bottom-2.5 left-3 flex gap-1.5 flex-wrap">
          {badges?.map(b => (
            <span key={b.label} className={`msk-badge ${badgeStyles[b.variant]}`}>{b.label}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold text-white leading-tight">{pkg.name}</h3>
          <div className="text-right shrink-0">
            {hasDiscount && (
              <span className="block text-[11px] text-dim line-through leading-tight">
                €{basePrice.toFixed(2)}
              </span>
            )}
            <span className={`text-[15px] font-bold ${isFree ? 'text-muted' : 'text-accent'}`}>
              {isFree ? 'Free' : `€${totalPrice.toFixed(2)}`}
            </span>
          </div>
        </div>

        {description && (
          <p className="text-xs text-muted leading-relaxed">{description}</p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] text-dim bg-bg border border-borderlt rounded px-2 py-0.5">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        <div className="flex gap-2 pt-2 border-t border-borderlt">
          <button
            onClick={() => addPackage(pkg.id, pkg.type)}
            disabled={isLoading}
            className="msk-btn-primary flex-1 justify-center text-xs py-2.5"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" />
              : isFree ? 'Download →'
              : needsLogin ? <><LogIn size={13} /> Login to Buy</>
              : <><ShoppingCart size={13} /> Add to Cart</>}
          </button>
          <Link href={`/packages/${pkg.id}`} className="msk-btn-ghost text-xs py-2.5 px-3" prefetch={true}>
            Details
          </Link>
        </div>
      </div>
    </div>
  )
}
