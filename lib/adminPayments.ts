/**
 * Payments in the admin: what kind a payment is, and the figures of the
 * overview (plan 6.6). Pure, so the payments area filters with the same rule
 * the overview counts with, and both are testable without Tebex.
 *
 * The Plugin API lists the latest 100 payments; there is no cheaper way to a
 * longer history. The figures therefore say whether the list reached back far
 * enough, instead of presenting a partial sum as the month.
 */

export type PaymentKind = 'paid' | 'free' | 'refunded' | 'chargeback' | 'other'

/** The fields this module reads; Tebex sends more. */
export interface PaymentLike {
  amount: number | string
  date: string
  status: string
  currency?: { iso_4217?: string } | null
}

/**
 * Paid, free (a package given at price 0, a giveaway prize), refunded or
 * charged back. A status Tebex adds later is `other`, not paid.
 */
export function paymentKind(p: Pick<PaymentLike, 'amount' | 'status'>): PaymentKind {
  const status = String(p.status ?? '').toLowerCase()
  if (status === 'refund') return 'refunded'
  if (status === 'chargeback') return 'chargeback'
  if (status !== 'complete') return 'other'
  return Number(p.amount) > 0 ? 'paid' : 'free'
}

export const DAY_MS = 86_400_000

export interface SalesSummary {
  /** Currency of the revenue figure: the one most payments in the window use. */
  currency: string | null
  /** Paid payments in the last 30 days, in `currency`. */
  revenue: number
  /** The 30 days before, only when the list reaches back that far. */
  previousRevenue: number | null
  /** Every payment in the last 30 days, whatever its state. */
  payments: number
  free: number
  refunds: number
  chargebacks: number
  /** False when the loaded list ends inside the 30 days: the figures are a lower bound. */
  complete: boolean
}

/**
 * The figures of the last 30 days from the latest `limit` payments. When the
 * list is shorter than `limit` it is the whole history; otherwise it only
 * covers a window its oldest entry reaches.
 */
export function summarizePayments(list: readonly PaymentLike[], now: number, limit: number): SalesSummary {
  const start = now - 30 * DAY_MS
  const previousStart = now - 60 * DAY_MS
  const dated = list
    .map(p => ({ p, at: Date.parse(p.date) }))
    .filter(({ at }) => Number.isFinite(at))
  const oldest = dated.reduce((min, { at }) => Math.min(min, at), Infinity)
  const covers = (from: number) => list.length < limit || oldest <= from

  const inWindow = dated.filter(({ at }) => at >= start && at <= now)
  const currencyCount = new Map<string, number>()
  for (const { p } of inWindow) {
    const iso = p.currency?.iso_4217
    if (iso && paymentKind(p) === 'paid') currencyCount.set(iso, (currencyCount.get(iso) ?? 0) + 1)
  }
  const currency = [...currencyCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? dated.find(({ p }) => p.currency?.iso_4217)?.p.currency?.iso_4217
    ?? null

  const sum = (from: number, to: number) => dated
    .filter(({ p, at }) => at >= from && at < to && paymentKind(p) === 'paid' && (p.currency?.iso_4217 ?? null) === currency)
    .reduce((total, { p }) => total + Number(p.amount), 0)
  const count = (kind: PaymentKind) => inWindow.filter(({ p }) => paymentKind(p) === kind).length

  return {
    currency,
    revenue: round2(sum(start, now + 1)),
    previousRevenue: covers(previousStart) ? round2(sum(previousStart, start)) : null,
    payments: inWindow.length,
    free: count('free'),
    refunds: count('refunded'),
    chargebacks: count('chargeback'),
    complete: covers(start),
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * The change between two periods as a whole percentage, or null when there is
 * nothing to compare with (plan 6.3: a trend only when the comparison says
 * something).
 */
export function percentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}
