import { cookies, headers } from 'next/headers'

import { LANG_HEADER, PATH_HEADER, langFromHeader } from '@/lib/lang'
import { LANG_COOKIE, chooseRootLang } from '@/lib/routes'
import type { Lang } from '@/lib/i18n'

/**
 * Language and internal path of the current request, set by the proxy.
 *
 * Only for server components. Client components get the same via
 * `useLang()` from the provider that the root layout feeds with these values.
 */
export async function getRequestLang(): Promise<{ lang: Lang; path: string }> {
  const h = await headers()
  return {
    lang: langFromHeader(h.get(LANG_HEADER)),
    // If the header is missing (route outside the proxy matcher), the root
    // is the most honest assumption: better a canonical to `/` than one
    // to a made-up address.
    path: h.get(PATH_HEADER) || '/',
  }
}

/**
 * The language to send a visitor back in, for route handlers whose own
 * address has no language: OAuth callbacks, Stripe and Tebex return URLs.
 * Same order as the redirect from `/`: the version the visitor used last
 * (`msk_lang`), then `Accept-Language`, then English.
 */
export async function getPreferredLang(): Promise<Lang> {
  const [c, h] = await Promise.all([cookies(), headers()])
  return chooseRootLang({ cookie: c.get(LANG_COOKIE)?.value, acceptLanguage: h.get('accept-language') })
}
