/**
 * API keys excluded from the /stats page.
 *
 * Add internal or test guild API keys here to keep public statistics clean.
 * Entries are matched against ticketbot_guilds.api_key.
 *
 * ⚠️  Do NOT commit real production API keys here if this file is public.
 *     For sensitive environments use the env variable STATS_IGNORED_API_KEYS
 *     (comma-separated) instead — it takes precedence over this list.
 */
export const STATS_IGNORED_API_KEYS: string[] = [
  // 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // My test server
]

/**
 * Returns the merged ignore list: env variable (if set) + static list above.
 * Deduplicates and removes empty strings.
 */
export function getIgnoredApiKeys(): string[] {
  const fromEnv = (process.env.STATS_IGNORED_API_KEYS ?? '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)

  return [...new Set([...fromEnv, ...STATS_IGNORED_API_KEYS])]
}
