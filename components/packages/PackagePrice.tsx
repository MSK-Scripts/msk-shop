'use client'

import { useSalePricesStore } from '@/store/salePrices'
import { Badge } from '@/components/ui/Badge'

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
  const discountPct = hasDiscount && effectiveBase > 0
    ? Math.round(((effectiveBase - effectiveTotal) / effectiveBase) * 100)
    : 0

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {hasDiscount && (
        <span className="font-mono text-sm text-[var(--color-muted-foreground)] line-through">
          {effectiveBase.toFixed(2)}€
        </span>
      )}
      <span
        className={`font-mono text-3xl font-bold tracking-tight ${isFree ? 'text-[var(--color-muted-foreground)]' : 'text-[var(--color-primary)]'}`}
      >
        {isFree ? 'Free' : `${effectiveTotal.toFixed(2)}€`}
      </span>
      <span className="text-xs text-[var(--color-muted-foreground)]">{currency}</span>
      {hasDiscount && <Badge variant="sale">Sale −{discountPct}%</Badge>}
    </div>
  )
}
