'use client'

import { useSalePricesStore } from '@/store/salePrices'

interface Props {
  packageId: number
  basePrice: number
  totalPrice: number
  currency: string
}

export function PackagePrice({ packageId, basePrice, totalPrice, currency }: Props) {
  const { prices } = useSalePricesStore()

  const saleData = prices[packageId]
  const effectiveBase = saleData?.base_price ?? basePrice
  const effectiveTotal = saleData?.total_price ?? totalPrice
  const hasDiscount = effectiveTotal < effectiveBase && effectiveBase > 0
  const isFree = effectiveBase === 0

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {hasDiscount && (
        <span className="text-dim line-through text-sm">
          €{effectiveBase.toFixed(2)}
        </span>
      )}
      <span className={`text-2xl font-extrabold ${isFree ? 'text-muted' : 'text-accent'}`}>
        {isFree ? 'Free' : `€${effectiveTotal.toFixed(2)}`}
      </span>
      <span className="text-dim text-xs">{currency}</span>
      {hasDiscount && (
        <span className="msk-badge bg-danger/10 text-danger border border-danger/25 text-xs">
          Sale
        </span>
      )}
    </div>
  )
}
