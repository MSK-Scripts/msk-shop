import { query, queryOne } from '@/lib/db'
import { NEWS_POPUP_DEFAULT, parseNewsPopup, type NewsPopupSettings } from '@/lib/newsPopup'

/**
 * Reading and writing the settings the admin dashboard can change without a
 * deploy. Server-only: this module reaches `lib/db`.
 *
 * The shape itself, and the validation that guards it, live in
 * `lib/newsPopup.ts` so the admin form can import them in the browser without
 * dragging `mysql2` along.
 */

const NEWS_POPUP_KEY = 'news_popup'

// ── Cache ────────────────────────────────────────────────────────────────────
//
// The root layout reads this on every request, and the layout is already
// dynamic (it needs headers() for the CSP nonce). One query per page view for
// a banner that is usually off is not worth it, so the value is held for a few
// seconds, the same arrangement `lib/pm2.ts` uses against fork storms.
//
// The TTL is what a save takes to become visible. Thirty seconds, because the
// alternative to a short delay is a deploy, which is what this replaces.

const CACHE_TTL_MS = 30_000

let cached: { value: NewsPopupSettings; at: number } | null = null

/** Drops the cache so a save shows up immediately for whoever saved it. */
export function invalidateNewsPopupCache(): void {
  cached = null
}

/**
 * Current settings, or the disabled default when the row is missing or the
 * database is unreachable.
 *
 * Fail-soft on purpose: the popup is an announcement, and a database blip must
 * not take the whole site's layout down with it.
 */
export async function loadNewsPopup(): Promise<NewsPopupSettings> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value

  try {
    const row = await queryOne<{ value: unknown }>(
      'SELECT value FROM msk_site_settings WHERE setting_key = ?', [NEWS_POPUP_KEY],
    )
    const value = row ? parseNewsPopup(row.value) : NEWS_POPUP_DEFAULT
    cached = { value, at: Date.now() }
    return value
  } catch (err) {
    console.error('[siteSettings] news popup unreadable:', err)
    // Not cached: a blip should not pin "off" for the next thirty seconds.
    return NEWS_POPUP_DEFAULT
  }
}

/** Writes the settings and returns what was actually stored (post-validation). */
export async function saveNewsPopup(
  raw: unknown,
  discordUserId: string,
): Promise<NewsPopupSettings> {
  const value = parseNewsPopup(raw)
  await query(
    `INSERT INTO msk_site_settings (setting_key, value, updated_by)
          VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)`,
    [NEWS_POPUP_KEY, JSON.stringify(value), discordUserId],
  )
  invalidateNewsPopupCache()
  return value
}
