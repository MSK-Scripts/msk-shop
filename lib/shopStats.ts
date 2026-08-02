import { queryOne } from '@/lib/db'

/**
 * Measured shop figures for the homepage.
 *
 * Written nightly by `scripts/tebex-stats.js`, read here as a single row. The
 * numbers exist to replace claims like "500+ customers" that nobody could
 * check, so the rules around them are deliberately strict:
 *
 *   - never invent a value,
 *   - never show a stale one as if it were current,
 *   - never let a database hiccup take the page down.
 *
 * A caller that gets `null` renders nothing.
 */

/**
 * Past this age the snapshot is treated as missing. The cron runs daily, so
 * three days means it has failed repeatedly and the figure should disappear
 * rather than quietly drift away from reality.
 */
const MAX_AGE_DAYS = 3

export interface ShopStats {
  /** Distinct CFX.re accounts with at least one completed payment. */
  uniqueBuyers: number
  /** Every payment on record, including declined ones. */
  totalPayments: number
  completedPayments: number
  refunds: number
  chargebacks: number
  /** Refunds plus chargebacks over all settled payments, as a fraction. */
  reversalRate: number
  /** First payment on record, or null when unknown. */
  firstPaymentAt: Date | null
  /** When the cron last wrote this row. */
  updatedAt: Date
}

interface Row {
  unique_buyers: number
  total_payments: number
  completed_payments: number
  refunds: number
  chargebacks: number
  reversal_rate: string | number
  first_payment_at: Date | null
  updated_at: Date
}

/**
 * Reads the snapshot. Returns `null` when there is none, when it is too old, or
 * when the database is unreachable.
 */
export async function loadShopStats(): Promise<ShopStats | null> {
  let row: Row | null
  try {
    row = await queryOne<Row>(
      `SELECT unique_buyers, total_payments, completed_payments, refunds,
              chargebacks, reversal_rate, first_payment_at, updated_at
         FROM msk_shop_stats
        WHERE id = 1`,
    )
  } catch (err) {
    console.warn('[shopStats] Snapshot nicht lesbar:', err)
    return null
  }

  if (!row) return null

  const updatedAt = row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at)
  if (Number.isNaN(updatedAt.getTime())) return null

  const ageDays = (Date.now() - updatedAt.getTime()) / 86_400_000
  if (ageDays > MAX_AGE_DAYS) {
    console.warn(`[shopStats] Snapshot ist ${ageDays.toFixed(1)} Tage alt, wird ausgeblendet.`)
    return null
  }

  const uniqueBuyers = Number(row.unique_buyers)
  // Null Käufer wäre kein Beleg, sondern ein kaputter Lauf.
  if (!Number.isFinite(uniqueBuyers) || uniqueBuyers <= 0) return null

  const reversalRate = Number(row.reversal_rate)

  return {
    uniqueBuyers,
    totalPayments: Number(row.total_payments) || 0,
    completedPayments: Number(row.completed_payments) || 0,
    refunds: Number(row.refunds) || 0,
    chargebacks: Number(row.chargebacks) || 0,
    reversalRate: Number.isFinite(reversalRate) ? reversalRate : 0,
    firstPaymentAt: row.first_payment_at ? new Date(row.first_payment_at) : null,
    updatedAt,
  }
}

/** Formats the reversal rate for display, e.g. `0,75` in German. */
export function formatReversalRate(rate: number, lang: 'de' | 'en'): string {
  return (rate * 100).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
