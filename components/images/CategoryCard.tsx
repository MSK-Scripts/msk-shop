import { Box, Car, Crosshair, Package, Sparkles, User, type LucideIcon } from 'lucide-react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Card } from '@/components/ui/Card'
import type { ImageCategory } from '@/lib/images'
import type { Lang } from '@/lib/i18n'

/**
 * Kategoriekachel der Galerie-Uebersicht.
 *
 * Die Icons stehen hier als feste Zuordnung und werden NICHT dynamisch aus dem
 * DB-Wert aufgeloest (`icons[row.icon]` auf dem ganzen lucide-Paket). Ein
 * dynamischer Zugriff nimmt dem Bundler die Moeglichkeit, den Rest der
 * Bibliothek wegzulassen, und zieht dann alle Icons in das Bundle.
 */
const ICONS: Record<string, LucideIcon> = {
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
    <Link href={`/images/${category.slug}`} className="group block">
      <Card hoverLift className="h-full p-5 text-center">
        <Icon
          className="mx-auto mb-3 h-7 w-7 text-[var(--color-primary)]"
          aria-hidden="true"
          strokeWidth={1.75}
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
