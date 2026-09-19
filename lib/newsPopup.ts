/**
 * Shape and validation of the news popup. Pure logic, NO database access, so
 * the admin form can import it in the browser.
 *
 * That split is not cosmetic: `lib/siteSettings.ts` pulls in `lib/db` and with
 * it `mysql2`, which requires `net` and `tls`. A client component importing
 * the two constants from there took the production build down with
 * "Module not found: Can't resolve 'net'" on 19.09.2026. Same arrangement as
 * `lib/adminPerms.ts` next to `lib/adminAuth.ts`.
 *
 * Settings the admin dashboard can change without a deploy.
 *
 * First tenant is the news popup. It lived in `lib/config.ts` as a build-time
 * constant, so switching on a two-day banner meant a commit, a CI run and a
 * deploy, and switching it off again meant a second one.
 *
 * ## Shape and trust
 *
 * The row is JSON, so nothing but this module knows what a valid document
 * looks like. `parseNewsPopup` is therefore the only way in: it is applied on
 * read as well as on write, and it returns the disabled default rather than
 * throwing. A row edited by hand in the database, or written by an older
 * version of this file, can then never reach the component as something it
 * does not expect.
 *
 * ## Links
 *
 * The two buttons end up in a `LocaleLink`. An `href` is restricted to an
 * internal path or an `https://` URL, which rules out `javascript:` and
 * `data:`. Only admins can write here, so this is defence in depth rather
 * than a hole being closed, but a stored XSS behind a permission is still a
 * stored XSS.
 */

export interface NewsPopupButton {
  label: string
  href:  string
}

export interface NewsPopupSettings {
  enabled:      boolean
  title:        string
  text:         string
  button:       NewsPopupButton | null
  secondButton: NewsPopupButton | null
  coupon:       string | null
}

/** A missing row means "off". That is also the right state for a fresh install. */
export const NEWS_POPUP_DEFAULT: NewsPopupSettings = {
  enabled:      false,
  title:        '',
  text:         '',
  button:       null,
  secondButton: null,
  coupon:       null,
}

/**
 * Caps, so a stray paste cannot produce a popup that covers the page. The
 * component renders into a fixed 320 px card.
 */
export const NEWS_POPUP_LIMITS = {
  title:  120,
  text:   600,
  label:  40,
  href:   300,
  coupon: 40,
} as const

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

/**
 * An internal path (`/foo`) or an absolute https URL. Anything else, including
 * a protocol-relative `//evil.example`, is rejected.
 */
export function isAllowedHref(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > NEWS_POPUP_LIMITS.href) return false
  if (value.startsWith('//')) return false
  if (value.startsWith('/')) return true
  return value.startsWith('https://')
}

function parseButton(raw: unknown): NewsPopupButton | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const label = str(r.label, NEWS_POPUP_LIMITS.label).trim()
  if (!label || !isAllowedHref(r.href)) return null
  return { label, href: r.href }
}

/** Normalise any input into a valid settings object. Never throws. */
export function parseNewsPopup(raw: unknown): NewsPopupSettings {
  let obj: unknown = raw
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { return NEWS_POPUP_DEFAULT }
  }
  if (!obj || typeof obj !== 'object') return NEWS_POPUP_DEFAULT

  const r = obj as Record<string, unknown>
  const coupon = str(r.coupon, NEWS_POPUP_LIMITS.coupon).trim()

  return {
    enabled:      r.enabled === true,
    title:        str(r.title, NEWS_POPUP_LIMITS.title),
    text:         str(r.text,  NEWS_POPUP_LIMITS.text),
    button:       parseButton(r.button),
    secondButton: parseButton(r.secondButton),
    coupon:       coupon || null,
  }
}
