import { headers } from 'next/headers'

import { LANG_HEADER, PATH_HEADER, langFromHeader } from '@/lib/lang'
import type { Lang } from '@/lib/i18n'

/**
 * Sprache und sprachloser Pfad der laufenden Anfrage, gesetzt vom Proxy.
 *
 * Nur für Server-Komponenten. Client-Komponenten bekommen dasselbe über
 * `useLang()` aus dem Provider, den das Root-Layout mit diesen Werten füttert.
 */
export async function getRequestLang(): Promise<{ lang: Lang; path: string }> {
  const h = await headers()
  return {
    lang: langFromHeader(h.get(LANG_HEADER)),
    // Fällt der Header aus (Route ausserhalb des Proxy-Matchers), ist die
    // Wurzel die ehrlichste Annahme: lieber ein Canonical auf `/` als eines
    // auf eine erfundene Adresse.
    path: h.get(PATH_HEADER) || '/',
  }
}
