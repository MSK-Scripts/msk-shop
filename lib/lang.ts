import type { Lang } from './i18n';

/**
 * Since 22.08.2026 the language lives in the **path**, no longer in a cookie.
 * English is at the root, German under `/de/`. The proxy internally rewrites
 * `/de/<path>` to `<path>` and puts the language into a
 * request header, so the route tree does not have to exist twice.
 *
 * Why no cookie anymore: two sources for the same question produced three bugs
 * in a single day, each time a page with `lang="de"` and English
 * content. A URL is also the only thing that can be linked, shared and
 * indexed.
 */

export const LANG_HEADER = 'x-lang';
/** Path without language prefix. Basis for canonical and hreflang. */
export const PATH_HEADER = 'x-path';

export const LANGS: readonly Lang[] = ['en', 'de'] as const;

/** Language served without a prefix. */
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function langFromHeader(value: string | null | undefined): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/**
 * Splits an incoming path into language and remaining path.
 *
 * `/de` and `/de/pakete` belong to it, `/deals` does not: the check is against the
 * complete segment.
 */
export function splitLangPath(pathname: string): { lang: Lang; path: string } {
  if (pathname === '/de' || pathname.startsWith('/de/')) {
    const rest = pathname.slice(3);
    return { lang: 'de', path: rest === '' ? '/' : rest };
  }
  return { lang: DEFAULT_LANG, path: pathname };
}

/**
 * Addresses that exist exactly once per site and therefore do not tolerate a
 * language prefix.
 *
 * Without this list the rewrite answers **every** address a second time
 * under `/de/`. Measured on 23.08.2026, `/de/sitemap.xml`,
 * `/de/robots.txt`, `/de/sitemap.xsl`, `/de/api/…`, `/de/favicon.ico`,
 * `/de/logo.png` and even `/de/_next/static/…` returned byte-identical content to the
 * root version. A sitemap belongs at exactly one address, a robots.txt
 * is only read at the root of the domain anyway, and a second name for
 * the same file is useless at best.
 *
 * The path arrives here **without** the prefix, so the check is against the
 * root version.
 */
export function istEinmaligeAdresse(path: string): boolean {
  return EINMALIG_EXAKT.has(path)
    || EINMALIG_PRAEFIXE.some(p => path === p || path.startsWith(`${p}/`))
}

/** Files with exactly this name and nothing below them. */
const EINMALIG_EXAKT = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-images.xml',
  '/sitemap.xsl',
  '/favicon.ico',
  '/logo.png',
])

/** Whole branches: the address itself and everything below it. */
const EINMALIG_PRAEFIXE = [
  '/api',
  '/_next',
  '/auth',
  '/botproxy',
]

/** Builds the address in the requested language from a language-less path. */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? '/de' : `/de${clean}`;
}

/** Both versions of a page, for hreflang and the language switcher. */
export function alternatePaths(path: string): Record<Lang, string> {
  return { en: localePath('en', path), de: localePath('de', path) };
}
