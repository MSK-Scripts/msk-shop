import type { Lang } from '@/lib/i18n'

/**
 * Dates, numbers and sizes for people, in the language of the page (plan
 * 5.9, 6.3). One formatter per kind, so the dashboards stop showing three
 * date formats side by side (`2026-10-26T13:00:34+00:00`, `19.10.2026,
 * 20:53:33`, `21 Sept 2026`).
 *
 * German writes `27.10.2026`, English `Oct 27, 2026`: the month as a word
 * avoids the day/month ambiguity of `10/27/2026` against `27/10/2026`.
 *
 * Every date is shown in German time. The shop, its contracts and its server
 * are in Germany, and a fixed zone makes the server render the same text the
 * browser hydrates; with the browser's zone a date near midnight would differ
 * between the two and React would throw the server HTML away.
 */
export const DISPLAY_TIME_ZONE = 'Europe/Berlin'

const LOCALE: Record<Lang, string> = { de: 'de-DE', en: 'en-US' }

/** A Date from what the API and the database hand over, or null if it does not parse. */
export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** `27.10.2026` or `Oct 27, 2026`; null for a missing or broken value, never "Invalid Date". */
export function formatDate(value: string | number | Date | null | undefined, lang: Lang): string | null {
  const date = toDate(value)
  if (!date) return null
  const options: Intl.DateTimeFormatOptions = lang === 'de'
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' }
  return new Intl.DateTimeFormat(LOCALE[lang], { ...options, timeZone: DISPLAY_TIME_ZONE }).format(date)
}

/** The value for a `<time dateTime>` attribute: the instant in ISO 8601. */
export function isoDate(value: string | number | Date | null | undefined): string | undefined {
  return toDate(value)?.toISOString()
}

/** A plain count with the separators of the language: `1.234` or `1,234`. */
export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang]).format(value)
}

/**
 * A file size, `29,4 kB` or `1.5 MB`. Binary steps (1 kB = 1024 bytes) as the
 * dashboard always counted them; the size limits in lib/tiers.ts are binary
 * as well, so a file at the limit shows the limit's number.
 */
export function formatBytes(bytes: number, lang: Lang): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0
  const kb = safe / 1024
  const [amount, unit] = kb < 1024 ? [kb, 'kilobyte'] : [kb / 1024, 'megabyte']
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: amount < 10 ? 1 : 0,
  }).format(amount)
}

/**
 * How long something is kept, from a number of days: `30 Tage`, `1 year`,
 * `10 Jahre`. Whole years are said as years, because "3,650 days" makes the
 * reader do the sum the page could have done.
 */
export function formatRetention(days: number, lang: Lang): string {
  const years = days >= 365 && days % 365 === 0 ? days / 365 : null
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'unit', unit: years !== null ? 'year' : 'day', unitDisplay: 'long',
  }).format(years ?? days)
}
