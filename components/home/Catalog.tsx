import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import Image from 'next/image'
import { Section, TextLink } from '@/components/home/Section'
import { formatEuro, resolveDisplayPrice } from '@/lib/price'
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
function priceValue(pkg: TebexPackage): number {
  return resolveDisplayPrice(pkg.base_price ?? 0, pkg.total_price ?? pkg.base_price ?? 0).price
}

function price(pkg: TebexPackage, lang: Lang): string {
  return formatEuro(priceValue(pkg), lang)
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
      href={`/fivem/${pkg.id}`}
      prefetch={false}
      className={'group/variant min-w-0 ' + (align === 'right' ? 'text-right' : '')}
    >
      <span
        className={
          'block font-display text-lead font-bold tabular-nums group-hover/variant:underline ' +
          (accent ? 'text-[var(--color-primary)]' : '')
        }
      >
        {price(pkg, lang)}
      </span>
      <span className="block text-small font-medium text-[var(--color-muted-foreground)]">
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
            // The image is the only content of this link. With an empty alt
            // the link has no name at all, for a screen reader as for a
            // crawler that reads the picture through its text.
            alt={row.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-h3 font-semibold text-[var(--color-muted-foreground)]">
            {row.name}
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
        <CardTitle className="font-display text-product font-[750] [font-stretch:112%]">
          <Link href={row.href} prefetch={false} className="hover:underline">
            {row.name}
          </Link>
        </CardTitle>

        {row.description && (
          <CardDescription className="line-clamp-3 text-small">
            {row.description}
          </CardDescription>
        )}

        {row.tags && row.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {row.tags.map(tag => (
              <Badge key={tag} variant="tag">{tag}</Badge>
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

/**
 * The paid catalogue rows, one per resource with both variants. Shared with
 * the hero, which shows the cheapest of them as its entry price.
 */
export function catalogRows(all: TebexPackage[]): Row[] {
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
        href: `/fivem/${lead.id}`,
        image: lead.image ?? null,
        badges: PACKAGE_BADGES[lead.id],
        tags: PACKAGE_TAGS[lead.id],
        encrypted,
        source,
      } satisfies Row
    })
    .flatMap(r => (r ? [r] : []))

  return rows
}

/** The cheapest paid script, or null without Tebex data. */
export function cheapestScript(all: TebexPackage[]): number | null {
  const prices = catalogRows(all)
    .flatMap(r => [r.encrypted, r.source])
    .flatMap(p => (p ? [priceValue(p)] : []))
    .filter(v => v > 0)
  return prices.length > 0 ? Math.min(...prices) : null
}

export function Catalog({ lang, packages: all }: { lang: Lang; packages: TebexPackage[] }) {
  const t = homeTranslations[lang]

  // Fail-soft: without Tebex (CI builds without secrets) the section drops
  // out instead of breaking the prerender. The page loads the packages once.
  const rows = catalogRows(all)
  if (rows.length === 0) return null

  const byId = new Map(all.map(p => [p.id, p]))

  const subs = SUBSCRIPTION_PACKAGE_IDS
  const subEncrypted = subs ? byId.get(subs.encrypted) : undefined
  const subSource = subs ? byId.get(subs.source) : undefined

  return (
    // No top rule: the proof line above already draws one.
    <Section
      className="border-t-0"
      id="catalog-title"
      kicker={t.catalog_kicker}
      title={t.catalog_heading}
      intro={t.catalog_subtitle}
      action={<TextLink href="/fivem">{t.catalog_all}</TextLink>}
    >
      {/* `auto-fit` with a fixed minimum: the paid scripts stay in one row
          wherever three fit, and stretch instead of leaving empty columns on
          a wide screen. The screenshot-first card follows in Phase 4. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-5">
        {rows.map(row => (
          <CatalogCard key={row.key} row={row} lang={lang} />
        ))}
      </div>

      {subEncrypted && subSource && (
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-5 py-4">
          <div className="min-w-[min(100%,16rem)] flex-1">
            <p className="font-display text-h3 font-[650]">{t.sub_heading}</p>
            <p className="mt-0.5 text-small text-[var(--color-muted-foreground)]">{t.sub_subtitle}</p>
          </div>
          <Variant pkg={subEncrypted} label={`${t.variant_encrypted} ${t.sub_per_month}`} lang={lang} align="right" />
          <Variant pkg={subSource} label={`${t.variant_source} ${t.sub_per_month}`} accent lang={lang} align="right" />
        </div>
      )}
    </Section>
  )
}
