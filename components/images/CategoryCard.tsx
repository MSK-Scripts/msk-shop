import { Cube as Box, Car, Crosshair, Package, Sparkle as Sparkles, User, type IconComponent } from '@/components/icons'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Card } from '@/components/ui/Card'
import type { ImageCategory } from '@/lib/images'
import type { Lang } from '@/lib/i18n'

/**
 * Category tile of the gallery overview.
 *
 * The keys are the icon names stored in `msk_image_categories.icon` (still
 * the names of the former icon set, so `Box` and `Sparkles`), mapped to the
 * Phosphor icons by a fixed table. Not a dynamic lookup on the icon package:
 * that would stop the bundler from leaving the unused icons out.
 */
const ICONS: Record<string, IconComponent> = {
  Car, Package, Crosshair, Box, User, Sparkles,
}

export function CategoryCard({
  category, lang, countLabel,
}: {
  category:   ImageCategory
  lang:       Lang
  countLabel: string
}) {
  const Icon = (category.icon && ICONS[category.icon]) || Package

  return (
    <Link href={`/tools/images/${category.slug}`} className="group block">
      <Card hoverLift className="h-full p-5 text-center">
        <Icon
          className="mx-auto mb-3 h-7 w-7 text-[var(--color-primary)]"
          aria-hidden="true"
        />
        <h3 className="text-base font-bold tracking-tight">{category.name}</h3>
        <p className="mt-1 font-mono text-xs text-[var(--color-muted-foreground)]">
          {countLabel}
        </p>
        {category.description && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {category.description}
          </p>
        )}
        <span className="sr-only">
          {lang === 'de' ? 'Kategorie öffnen' : 'Open category'}
        </span>
      </Card>
    </Link>
  )
}
