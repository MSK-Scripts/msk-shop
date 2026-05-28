'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Loader2, LogIn } from 'lucide-react'
import { useCart } from '@/lib/useCart'
import { useSalePricesStore } from '@/store/salePrices'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Badge as ConfigBadge } from '@/lib/config'
import type { TebexPackage } from '@/types/tebex'

interface Props {
  pkg: TebexPackage
  tags?: string[]
  badges?: ConfigBadge[]
  description?: string
}

export function PackageCard({ pkg, tags, badges, description }: Props) {
  const { addPackage, isLoading, username } = useCart()
  const { prices } = useSalePricesStore()

  const saleData = prices[pkg.id]
  const basePrice = saleData?.base_price ?? pkg.base_price ?? 0
  const totalPrice = saleData?.total_price ?? pkg.total_price ?? basePrice
  const hasDiscount = totalPrice < basePrice && basePrice > 0
  const isFree = basePrice === 0
  const needsLogin = !username && !isFree
  const discountPct = hasDiscount && basePrice > 0
    ? Math.round(((basePrice - totalPrice) / basePrice) * 100)
    : 0

  return (
    <Card hoverLift className="group flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))] to-[color-mix(in_oklab,var(--color-primary)_2%,var(--color-card))]">
        {pkg.image ? (
          <Image
            src={pkg.image}
            alt={pkg.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-2xl font-semibold tracking-wider text-[color-mix(in_oklab,var(--color-foreground)_18%,transparent)]">
              {pkg.name.toLowerCase().replace(/\s+/g, '_')}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Sale Badge — top right */}
        {hasDiscount && (
          <div className="absolute right-3 top-3 z-10">
            <Badge variant="sale">Sale −{discountPct}%</Badge>
          </div>
        )}

        {/* Other Badges — bottom left */}
        {badges && badges.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
            {badges.map(b => (
              <Badge key={b.label} variant={b.variant as BadgeVariant}>{b.label}</Badge>
            ))}
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <CardTitle className="text-lg">{pkg.name}</CardTitle>

        {description && <CardDescription>{description}</CardDescription>}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-[0.625rem] text-[var(--color-muted-foreground)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + Buttons */}
        <div className="flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col leading-none">
            {hasDiscount && (
              <span className="font-mono text-xs text-[var(--color-muted-foreground)] line-through">
                {basePrice.toFixed(2)}€
              </span>
            )}
            <span className={`font-mono font-bold tracking-tight ${isFree ? 'text-xl text-[var(--color-muted-foreground)]' : 'text-2xl text-[var(--color-primary)]'}`}>
              {isFree ? 'Free' : `${totalPrice.toFixed(2)}€`}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => addPackage(pkg.id, pkg.type)}
              disabled={isLoading}
            >
              {isLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isFree ? (
                    <>Download</>
                  ) : needsLogin ? (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      Login
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add
                    </>
                  )}
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/packages/${pkg.id}`} prefetch={true}>
                Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
