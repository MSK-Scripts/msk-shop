import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getPackages } from '@/lib/tebex'
import { resolveDisplayPrice } from '@/lib/price'
import { plainExcerpt } from '@/lib/seo'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import {
  PACKAGE_DESCRIPTIONS,
  PACKAGE_BADGES,
  PACKAGE_TAGS,
  SUBSCRIPTION_PACKAGE_IDS,
  type Badge as ConfigBadge,
} from '@/lib/config'
import { RESOURCE_STATS } from '@/content/resource-stats'
import { homeTranslations, type Lang } from '@/lib/i18n'
import type { TebexPackage } from '@/types/tebex'

/**
 * The paid catalogue, in full, on the homepage.
 *
 * Previously three of the four paid resources appeared as cards and the fourth
 * did not appear at all. Showing all of them removes that arbitrary cut.
 *
 * Each card pairs the Encrypted and Source variant of one resource, so the
 * choice the product names keep referring to is visible at the point of
 * decision rather than explained a thousand pixels lower. The card itself
 * carries the artwork, badges and dependency tags, because those are what a
 * buyer scans for first.
 *
 * Server component on purpose: no add-to-cart button here. A single button
 * would have to pick one of the two variants for the visitor, and picking for
 * them is exactly what this section is trying to avoid. Both prices link to
 * the respective package page, where the cart lives.
 */

/**
 * Katalogpreis, wie ihn ein ausgeloggter Besucher sieht.
 *
 * Bewusst ohne Sale-Daten: die sind user-spezifisch und hängen an einem
 * authentifizierten Basket-Ident, den es hier server-seitig nicht gibt.
 */
function price(pkg: TebexPackage, lang: Lang): string {
  const { price: value } = resolveDisplayPrice(
    pkg.base_price ?? 0,
    pkg.total_price ?? pkg.base_price ?? 0,
  )
  return `${value.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

function Variant({
  pkg,
  label,
  accent,
  lang,
  align = 'left',
}: {
  pkg: TebexPackage
  label: string
  accent?: boolean
  lang: Lang
  align?: 'left' | 'right'
}) {
  return (
    <Link
      href={`/packages/${pkg.id}`}
      prefetch={false}
      className={'group/variant min-w-0 ' + (align === 'right' ? 'text-right' : '')}
    >
      <span
        className={
          'block font-mono text-[0.9375rem] font-bold tabular-nums group-hover/variant:underline ' +
          (accent ? 'text-[var(--color-primary)]' : '')
        }
      >
        {price(pkg, lang)}
      </span>
      <span className="block text-[0.6875rem] font-medium text-[var(--color-muted-foreground)]">
        {label}
      </span>
    </Link>
  )
}

interface Row {
  key: string
  name: string
  description: string
  href: string
  image: string | null
  badges?: ConfigBadge[]
  tags?: string[]
  encrypted?: TebexPackage
  source?: TebexPackage
}

function CatalogCard({ row, lang }: { row: Row; lang: Lang }) {
  const t = homeTranslations[lang]

  return (
    <Card hoverLift className="group flex flex-col overflow-hidden">
      {/* Feste Bildhöhe statt `aspect-video`: die Karten stehen je nach
          Breakpoint in einer, zwei oder vier Spalten, ein Seitenverhältnis
          würde das Banner bei zwei Spalten auf über 300 px aufblasen. */}
      <Link href={row.href} prefetch={false} className="relative block h-44 overflow-hidden bg-[color-mix(in_oklab,var(--color-primary)_6%,var(--color-card))]">
        {row.image ? (
          <Image
            src={row.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-lg font-semibold tracking-wider text-[color-mix(in_oklab,var(--color-foreground)_18%,transparent)]">
            {row.key}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {row.badges && row.badges.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {row.badges.map(b => (
              <Badge key={b.label} variant={b.variant as BadgeVariant}>{b.label}</Badge>
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <CardTitle className="text-base">
          <Link href={row.href} prefetch={false} className="hover:underline">
            {row.name}
          </Link>
        </CardTitle>

        {row.description && (
          <CardDescription className="line-clamp-3 text-[0.8125rem]">
            {row.description}
          </CardDescription>
        )}

        {row.tags && row.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {row.tags.map(tag => (
              <span
                key={tag}
                className="rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-[0.625rem] text-[var(--color-muted-foreground)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Beide Varianten nebeneinander. `justify-between` statt eines Grids,
            damit eine fehlende Variante nicht eine leere Spalte hinterlässt. */}
        <div className="flex items-end justify-between gap-3 border-t border-[var(--color-border)] pt-3">
          {row.encrypted && (
            <Variant pkg={row.encrypted} label={t.variant_encrypted} lang={lang} />
          )}
          {row.source && (
            <Variant pkg={row.source} label={t.variant_source} accent lang={lang} align="right" />
          )}
        </div>
      </div>
    </Card>
  )
}

export async function Catalog({ lang }: { lang: Lang }) {
  const t = homeTranslations[lang]

  // Fail-soft wie bisher: ohne Tebex-Zugriff (CI-Builds ohne Secrets) fällt die
  // Sektion weg, statt den Prerender zu sprengen.
  const all = await getPackages().catch(err => {
    console.warn('[Catalog] Tebex nicht verfügbar, Sektion ausgeblendet:', err)
    return [] as TebexPackage[]
  })
  if (all.length === 0) return null

  const byId = new Map(all.map(p => [p.id, p]))

  // Die Paarung Encrypted ⇄ Source steht in content/resource-stats.ts, damit
  // sie nicht ein zweites Mal gepflegt werden muss.
  const rows: Row[] = RESOURCE_STATS
    .filter(r => r.tier === 'paid' && r.packages)
    .map(r => {
      const encrypted = byId.get(r.packages!.encrypted)
      const source = byId.get(r.packages!.source)
      if (!encrypted && !source) return null
      // Bild, Badges und Tags hängen an der Encrypted-Variante, weil die in
      // lib/config.ts die führende Id ist. Fällt sie aus, greift Source.
      const lead = encrypted ?? source!
      return {
        key: r.resourceName,
        name: r.displayName,
        description: PACKAGE_DESCRIPTIONS[lead.id] ?? plainExcerpt(lead.description ?? '', 140),
        href: `/packages/${lead.id}`,
        image: lead.image ?? null,
        badges: PACKAGE_BADGES[lead.id],
        tags: PACKAGE_TAGS[lead.id],
        encrypted,
        source,
      } satisfies Row
    })
    .flatMap(r => (r ? [r] : []))

  if (rows.length === 0) return null

  const subs = SUBSCRIPTION_PACKAGE_IDS
  const subEncrypted = subs ? byId.get(subs.encrypted) : undefined
  const subSource = subs ? byId.get(subs.source) : undefined

  return (
    <section className="container-page py-14 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t.catalog_heading}</h2>
          <p className="mt-2 max-w-[62ch] text-sm text-[var(--color-muted-foreground)]">
            {t.catalog_subtitle}
          </p>
        </div>
        <Link
          href="/packages"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:underline"
        >
          {t.catalog_all}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Vier bezahlte Ressourcen: eine Reihe ab xl, davor 2×2, auf dem Telefon
          gestapelt. Kein lg-Zwischenschritt, bei drei Spalten stünde die vierte
          Karte allein in der zweiten Reihe. */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(row => (
          <CatalogCard key={row.key} row={row} lang={lang} />
        ))}
      </div>

      {subEncrypted && subSource && (
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_50%,var(--color-background))] px-5 py-4">
          <div className="min-w-[16rem] flex-1">
            <div className="font-semibold">{t.sub_heading}</div>
            <p className="mt-0.5 text-[0.8125rem] text-[var(--color-muted-foreground)]">
              {t.sub_subtitle}
            </p>
          </div>
          <Variant pkg={subEncrypted} label={`${t.variant_encrypted} ${t.sub_per_month}`} lang={lang} align="right" />
          <Variant pkg={subSource} label={`${t.variant_source} ${t.sub_per_month}`} accent lang={lang} align="right" />
        </div>
      )}
    </section>
  )
}
