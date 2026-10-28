import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Gift, Trash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { CartLine } from '@/lib/cartLines'
import { cartTranslations, packagesTranslations, type Lang } from '@/lib/i18n'
import { formatEuro } from '@/lib/price'
import { cn } from '@/lib/utils'

/**
 * The packages in the basket, one row each: product name and variant, the
 * gift details as before, the price and a remove button. A list with rules
 * between the rows, not a card per row: the page or the drawer is the frame.
 */
export function CartLineList({
  lang, lines, onRemove, busy, compact = false, onNavigate,
}: {
  lang: Lang
  lines: CartLine[]
  onRemove: (id: number) => void
  busy: boolean
  compact?: boolean
  /** Called when a product link is followed, e.g. to close the drawer. */
  onNavigate?: () => void
}) {
  const t = cartTranslations[lang]
  const tp = packagesTranslations[lang]

  return (
    <ul aria-label={t.items_label} className={cn('grid', !compact && 'border-t border-[var(--color-border)]')}>
      {lines.map(line => {
        const variant = line.variant === 'source' ? tp.variant_source : line.variant === 'encrypted' ? tp.variant_encrypted : null
        return (
          <li
            key={line.id}
            className={cn(
              'grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-[clamp(0.75rem,0.5rem+0.6vw,1.25rem)] border-b border-[var(--color-border)]',
              compact ? 'py-3' : 'py-[clamp(0.875rem,0.6rem+0.6vw,1.5rem)]',
            )}
          >
            {line.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={line.image}
                alt=""
                className={cn(
                  'shrink-0 rounded-md border border-[var(--color-border)] object-cover',
                  compact ? 'h-12 w-12' : 'h-[clamp(3.5rem,3rem+1.5vw,5.5rem)] w-[clamp(3.5rem,3rem+1.5vw,5.5rem)]',
                )}
              />
            ) : (
              <span aria-hidden className={cn('rounded-md bg-[var(--color-muted)]', compact ? 'h-12 w-12' : 'h-14 w-14')} />
            )}

            <div className="grid min-w-0 gap-0.5">
              <p className={cn('font-semibold', !compact && 'font-display text-lead')}>
                {line.href ? (
                  <Link href={line.href} onClick={onNavigate} className="underline-offset-4 hover:text-[var(--color-primary)] hover:underline">
                    {line.name}
                  </Link>
                ) : line.name}
              </p>
              {variant && (
                <p className="text-small text-[var(--color-muted-foreground)]">{t.variant.replace('{variant}', variant)}</p>
              )}
              {line.gift && (
                <p className="flex items-start gap-1.5 text-small">
                  <Gift className="mt-[0.2em] h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <span>{t.gift_for.replace('{name}', line.gift.username)}</span>
                </p>
              )}
              {line.gift?.discordId && (
                <p className="break-words pl-[1.375rem] text-small tabular-nums text-[var(--color-muted-foreground)]">
                  {t.gift_discord.replace('{id}', line.gift.discordId)}
                </p>
              )}
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
                <span className="font-semibold">{line.price === 0 ? t.free : formatEuro(line.price, lang)}</span>
                {line.originalPrice !== null && (
                  <s className="text-small text-[var(--color-muted-foreground)]">{formatEuro(line.originalPrice, lang)}</s>
                )}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(line.id)}
              disabled={busy}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)]"
              aria-label={t.remove_item.replace('{name}', variant ? `${line.name} (${variant})` : line.name)}
            >
              <Trash className="h-5 w-5" />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
