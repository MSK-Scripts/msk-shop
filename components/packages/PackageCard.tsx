'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Loader2, LogIn } from 'lucide-react'
import { useCart } from '@/lib/useCart'
import { useSalePricesStore } from '@/store/salePrices'
import { resolveDisplayPrice } from '@/lib/price'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { resolveVariant, type Badge as ConfigBadge } from '@/lib/config'
import type { TebexPackage } from '@/types/tebex'
import { packagesTranslations, type Lang } from '@/lib/i18n'

interface Props {
  pkg: TebexPackage
  tags?: string[]
  badges?: ConfigBadge[]
  description?: string
  /** Beide Routen, die diese Karte rendern, loesen die Sprache serverseitig auf
   *  und reichen sie durch. Ohne die Prop blieben die Beschriftungen englisch,
   *  auch auf einer Seite mit `lang="de"`. */
  lang: Lang
}

export function PackageCard({ pkg, tags, badges, description, lang }: Props) {
  const { addPackage, pendingPackageId, username } = useCart()
  const t = packagesTranslations[lang]
  // Nur diese Karte darf reagieren. Vorher hing der Spinner am globalen
  // `isLoading`, ein Klick liess also alle Karten des Rasters gleichzeitig
  // laden und sperrte sie.
  const busy = pendingPackageId === pkg.id
  // Der Lizenzunterschied ist Schritt 1 des Kaufablaufs und stand bisher
  // nirgends auf der Karte.
  const variant = resolveVariant(pkg)
  const [failed, setFailed] = useState(false)
  const { prices } = useSalePricesStore()

  const { original, price, isFree, hasDiscount, discountPct } =
    resolveDisplayPrice(pkg.base_price ?? 0, pkg.total_price ?? pkg.base_price ?? 0, prices[pkg.id])
  const needsLogin = !username && !isFree

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
            <Badge variant="sale">{t.card_sale} −{discountPct}%</Badge>
          </div>
        )}

        {/* Other Badges — bottom left */}
        {((badges && badges.length > 0) || variant) && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1.5">
            {variant && (
              <Badge variant="outline" className="bg-[var(--color-card)]">
                {variant === 'source' ? t.variant_source : t.variant_encrypted}
              </Badge>
            )}
            {badges?.map(b => (
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
                {original.toFixed(2)}€
              </span>
            )}
            <span className={`font-mono font-bold tracking-tight ${isFree ? 'text-xl text-[var(--color-muted-foreground)]' : 'text-2xl text-[var(--color-primary)]'}`}>
              {isFree ? t.card_free : `${price.toFixed(2)}€`}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="md"
              className="tap-target"
              onClick={async () => {
                setFailed(false)
                setFailed(!(await addPackage(pkg.id, pkg.type)))
              }}
              disabled={busy}
            >
              {busy
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isFree ? (
                    <>{t.card_download}</>
                  ) : needsLogin ? (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      {t.card_login}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {t.card_add}
                    </>
                  )}
            </Button>
            <Button asChild size="md" variant="outline" className="tap-target">
              <Link href={`/packages/${pkg.id}`} prefetch={true}>
                {t.card_details}
              </Link>
            </Button>
          </div>
        </div>

        {/* Vorher endete jeder Fehlschlag in `console.error` und die Karte sah
            aus, als sei nichts passiert. */}
        {failed && (
          <p role="alert" className="mt-2 text-xs text-[var(--color-danger)]">
            {t.card_error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
