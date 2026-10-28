import type { ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { Check } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { TICKETBOT_COPY } from '@/content/ticketbot-copy'
import { subscriptionTermsTranslations, type Lang } from '@/lib/i18n'
import { TRIAL_DAYS } from '@/lib/stripe'
import { TIER_CONFIG, formatTierPrice, yearlyMonthsFree, type Tier } from '@/lib/tiers'
import { cn } from '@/lib/utils'

/** Column order of the table; matches `tierCards` in the copy file. */
export const TIER_KEYS = ['basic', 'premium', 'premium_plus', 'business'] as const satisfies readonly Tier[]

const mb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`

/**
 * The ticket bot's plans as a table: plans as columns, features as rows, the
 * recommended plan marked (plan 5.7, sample page of Phase 0). Up to five
 * offers a fixed comparison table is the right tool, and every row a card
 * list leaves out is a question the buyer has to ask.
 *
 * Every value comes from TIER_CONFIG, the table the checkout charges from.
 * § 312j Abs. 2 BGB wants the price before the order button to be the price
 * charged; a figure typed into the copy file would be a second source that
 * nothing keeps in step. `tests/botPrices.test.ts` changes a price in
 * TIER_CONFIG and expects the table to follow.
 *
 * Yes and No as words with a sign, not as colour. Numbers right-aligned and
 * tabular. The table scrolls in itself on a phone, the page does not (4.7).
 */
export function TicketBotTiers({ lang, captionId = 'tiers-caption' }: { lang: Lang; captionId?: string }) {
  const t = TICKETBOT_COPY[lang]
  const terms = subscriptionTermsTranslations[lang]

  const yes = (
    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-foreground)]">
      <Check className="h-4 w-4 text-[var(--color-success)]" />
      {t.tierYes}
    </span>
  )
  const no = <span className="text-[var(--color-muted-foreground)]">{t.tierNo}</span>
  const flag = (on: boolean) => (on ? yes : no)

  const storage = (days: number) =>
    // From two years up a day count stops being readable: "3650 days" against
    // the "10 years" in the terms.
    days >= 730
      ? t.tierYears.replace('{n}', String(Math.round(days / 365)))
      : t.tierDays.replace('{n}', String(days))

  const rows: Array<{ label: string; cell: (tier: Tier, i: number) => ReactNode; numeric?: boolean }> = [
    {
      label: t.tierRowMonth,
      numeric: true,
      cell: (tier, i) => (
        <span className="font-display text-lead font-[650] text-[var(--color-foreground)]">
          {t.tierCards[i].priceOverride ?? formatTierPrice(tier, lang)}
        </span>
      ),
    },
    {
      label: t.tierRowYear,
      numeric: true,
      cell: tier => {
        const free = yearlyMonthsFree(tier)
        if (TIER_CONFIG[tier].priceCentsYearly <= 0) return t.tierNone
        return (
          <span className="grid justify-items-end">
            <span className="font-semibold text-[var(--color-foreground)]">{formatTierPrice(tier, lang, 'yearly')}</span>
            {free > 0 && <span className="text-label">{t.tierMonthsFree.replace('{n}', String(free))}</span>}
          </span>
        )
      },
    },
    {
      label: t.tierRowTrial,
      numeric: true,
      cell: tier => (TIER_CONFIG[tier].priceCents > 0 ? t.tierDays.replace('{n}', String(TRIAL_DAYS)) : t.tierNone),
    },
    { label: t.tierRowHosting, cell: () => yes },
    { label: t.tierRowTranscript, numeric: true, cell: tier => mb(TIER_CONFIG[tier].transcriptMaxBytes) },
    {
      label: t.tierRowAttachments,
      numeric: true,
      cell: tier => (TIER_CONFIG[tier].attachments ? mb(TIER_CONFIG[tier].attachmentMaxBytes) : no),
    },
    { label: t.tierRowStorage, numeric: true, cell: tier => storage(TIER_CONFIG[tier].storageDays) },
    { label: t.tierRowUploads, numeric: true, cell: tier => String(TIER_CONFIG[tier].uploadsPerHour) },
    { label: t.tierRowDomain, cell: tier => flag(TIER_CONFIG[tier].customDomain) },
    { label: t.tierRowBranding, cell: tier => flag(TIER_CONFIG[tier].removeBranding) },
    // Reads the tier table. Until 19.09.2026 this line was "every tier except
    // the free one", hard-wired to the card's position, which stopped matching
    // the moment hosting moved up a tier.
    { label: t.tierRowHosted, cell: tier => flag(TIER_CONFIG[tier].botHosting) },
  ]

  // The highlighted plan is the one with the badge, a single decision in the copy file.
  const recommended = t.tierCards.findIndex(c => c.badge !== null)
  const th = 'border-b border-[var(--color-border)] px-3.5 py-3 text-left align-top'
  const pick = (i: number) => i === recommended && 'bg-[var(--color-accent-soft)]'

  return (
    <div className="grid gap-[var(--space-stack)]">
      <div
        className="max-w-[72rem] overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]"
        role="region"
        aria-labelledby={captionId}
        tabIndex={0}
      >
        <table className="w-full min-w-[44rem] border-collapse text-small">
          <caption id={captionId} className="border-b border-[var(--color-border)] px-3.5 py-3 text-left font-semibold">
            {t.tierCaption}
          </caption>
          <thead className="bg-[var(--color-accent-soft)]">
            <tr>
              <th scope="col" className={cn(th, 'font-semibold')}>{t.tierPlan}</th>
              {TIER_KEYS.map((tier, i) => (
                <th
                  key={tier}
                  scope="col"
                  className={cn(
                    th,
                    'text-right font-display text-lead font-[650]',
                    i === recommended && 'shadow-[inset_0_3px_0_var(--color-primary)]',
                  )}
                >
                  {t.tierCards[i].badge && (
                    <span className="block font-sans text-label font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                      {t.tierCards[i].badge}
                    </span>
                  )}
                  {t.tierCards[i].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <th scope="row" className={cn(th, 'font-semibold')}>{row.label}</th>
                {TIER_KEYS.map((tier, i) => (
                  <td
                    key={tier}
                    className={cn(
                      th,
                      'text-[var(--color-muted-foreground)]',
                      row.numeric ? 'text-right tabular-nums' : 'text-right',
                      pick(i),
                    )}
                  >
                    {row.cell(tier, i)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" className="px-3.5 py-3.5 text-left">
                <span className="sr-only">{t.tierRowAction}</span>
              </th>
              {TIER_KEYS.map((tier, i) => (
                <td key={tier} className={cn('px-3.5 py-3.5 text-right', pick(i))}>
                  {/* Verify and dashboard depend on the session: no prefetch,
                      or the client router caches the redirect decision. */}
                  <Button asChild size="md" variant={i === recommended ? 'primary' : 'outline'}>
                    <Link href="/dashboard/ticket-bot/verify" prefetch={false}>{t.tierCards[i].cta}</Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid max-w-[46rem] gap-3 text-small text-[var(--color-muted-foreground)]">
        {/* Price statement of the subscriptions, draft 2.3 of the legal texts. */}
        <p>{terms.contract_partner} {terms.vat_exempt} {terms.final_prices}</p>
        <p>
          <span className="font-semibold text-[var(--color-foreground)]">{t.tierNote.title}.</span>{' '}
          {t.tierNote.text}
        </p>
        <p>{t.cancelNote}</p>
      </div>
    </div>
  )
}
