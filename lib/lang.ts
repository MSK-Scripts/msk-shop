import type { Lang } from './i18n';

export const LANG_COOKIE_NAME = 'msk_lang';
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const SUPPORTED: readonly Lang[] = ['en', 'de'] as const;

function isSupportedLang(value: unknown): value is Lang {
  return typeof value === 'string' && (SUPPORTED as readonly string[]).includes(value);
}

/**
 * Parse an Accept-Language header and pick the highest-quality supported
 * language. Falls back to 'en' if no language matches.
 */
export function parseAcceptLanguage(header: string | null | undefined): Lang {
  if (!header) return 'en';
  const parts = header.split(',').map(part => {
    const [tag, ...params] = part.trim().split(';');
    const qParam = params.find(p => p.trim().toLowerCase().startsWith('q='));
    const quality = qParam ? parseFloat(qParam.split('=')[1]) : 1;
    return { primary: tag.split('-')[0].toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
  });
  parts.sort((a, b) => b.quality - a.quality);
  for (const { primary } of parts) {
    if (primary === 'de') return 'de';
    if (primary === 'en') return 'en';
  }
  return 'en';
}

/**
 * Resolve the active language for a request: cookie first (explicit user
 * choice), then Accept-Language header, default 'en'.
 *
 * `cookieValue` and `acceptLanguage` are passed in directly so this helper
 * stays compatible with both Server Components (next/headers) and route
 * handlers (Request.headers).
 */
export function resolveLang(cookieValue: string | undefined, acceptLanguage: string | null | undefined): Lang {
  if (isSupportedLang(cookieValue)) return cookieValue;
  return parseAcceptLanguage(acceptLanguage);
}

/**
 * Client-side: persist the chosen language in the msk_lang cookie. Must run
 * in the browser. Uses Secure on HTTPS, omits it on http://localhost so dev
 * still works.
 */
export function setLangCookie(lang: Lang): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; Path=/; Max-Age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
