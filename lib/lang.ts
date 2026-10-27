import type { Lang } from './i18n';

/**
 * The language lives in the path: every page is under `/en/` or `/de/`, and
 * `/` redirects to one of them. Which address a page has in which language is
 * the business of the route table in `lib/routes.ts`; this file only holds
 * the language basics both sides of the proxy share.
 *
 * Why the path and not a cookie as the source: two sources for the same
 * question produced three bugs in a single day (22.08.2026), each time a page
 * with `lang="de"` and English content. A URL is also the only thing that can
 * be linked, shared and indexed. The `msk_lang` cookie only remembers the
 * version a visitor used last, for the redirect from `/`.
 */

export const LANG_HEADER = 'x-lang';
/** Internal path of the page (`/legal/terms`). Basis for canonical and hreflang. */
export const PATH_HEADER = 'x-path';

export const LANGS: readonly Lang[] = ['en', 'de'] as const;

/** Fallback language: for `/` without any hint and for addresses without a prefix. */
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function langFromHeader(value: string | null | undefined): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}
