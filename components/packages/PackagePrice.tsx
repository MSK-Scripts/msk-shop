'use client'

import { useSalePricesStore } from '@/store/salePrices'
import { resolveDisplayPrice } from '@/lib/price'
import { Badge } from '@/components/ui/Badge'

interface Props {
  packageId: number
  basePrice: number
  totalPrice: number
  currency: string
}

export function PackagePrice({ packageId, basePrice, totalPrice, currency }: Props) {
  const { prices } = useSalePricesStore()

  const { original, price, isFree, hasDiscount, discountPct } =
    resolveDisplayPrice(basePrice, totalPrice, prices[packageId])

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {hasDiscount && (
        <span className="font-mono text-sm text-[var(--color-muted-foreground)] line-through">
          {original.toFixed(2)}€
        </span>
      )}
      <span
        className={`font-mono text-3xl font-bold tracking-tight ${isFree ? 'text-[var(--color-muted-foreground)]' : 'text-[var(--color-primary)]'}`}
      >
        {isFree ? 'Free' : `${price.toFixed(2)}€`}
      </span>
      <span className="text-xs text-[var(--color-muted-foreground)]">{currency}</span>
      {hasDiscount && <Badge variant="sale">Sale −{discountPct}%</Badge>}
    </div>
  )
}
