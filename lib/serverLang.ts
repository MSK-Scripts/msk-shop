import { headers } from 'next/headers'

import { LANG_HEADER, PATH_HEADER, langFromHeader } from '@/lib/lang'
import type { Lang } from '@/lib/i18n'

/**
 * Language and language-less path of the current request, set by the proxy.
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
