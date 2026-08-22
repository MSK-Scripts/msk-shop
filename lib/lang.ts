import type { Lang } from './i18n';

/**
 * Sprache steckt seit dem 22.08.2026 im **Pfad**, nicht mehr in einem Cookie.
 * Englisch liegt auf der Wurzel, Deutsch unter `/de/`. Der Proxy schreibt
 * `/de/<pfad>` intern auf `<pfad>` um und legt die Sprache in einen
 * Request-Header, damit der Routenbaum nicht doppelt existieren muss.
 *
 * Warum kein Cookie mehr: zwei Quellen für dieselbe Frage haben an einem Tag
 * drei Fehler produziert, jedes Mal eine Seite mit `lang="de"` und englischem
 * Inhalt. Eine URL ist ausserdem das Einzige, was sich verlinken, teilen und
 * indexieren lässt.
 */

export const LANG_HEADER = 'x-lang';
/** Pfad ohne Sprachpräfix. Basis für Canonical und hreflang. */
export const PATH_HEADER = 'x-path';

export const LANGS: readonly Lang[] = ['en', 'de'] as const;

/** Sprache, die ohne Präfix ausgeliefert wird. */
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function langFromHeader(value: string | null | undefined): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/**
 * Zerlegt einen eingehenden Pfad in Sprache und Restpfad.
 *
 * `/de` und `/de/pakete` gehören dazu, `/deals` nicht: geprüft wird auf das
 * vollständige Segment.
 */
export function splitLangPath(pathname: string): { lang: Lang; path: string } {
  if (pathname === '/de' || pathname.startsWith('/de/')) {
    const rest = pathname.slice(3);
    return { lang: 'de', path: rest === '' ? '/' : rest };
  }
  return { lang: DEFAULT_LANG, path: pathname };
}

/** Baut aus einem sprachlosen Pfad die Adresse in der gewünschten Sprache. */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? '/de' : `/de${clean}`;
}

/** Beide Fassungen einer Seite, für hreflang und den Sprachumschalter. */
export function alternatePaths(path: string): Record<Lang, string> {
  return { en: localePath('en', path), de: localePath('de', path) };
}
