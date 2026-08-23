'use client'

import { createContext, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'

import type { Lang } from '@/lib/i18n'
import { localePath, splitLangPath } from '@/lib/lang'
import { useHydrated } from '@/lib/useHydrated'

interface LangContextValue {
  /** Sprache der laufenden Seite, aus dem Pfad abgeleitet. */
  lang: Lang
  /** Pfad ohne Sprachpräfix, Basis für Links in die jeweils andere Fassung. */
  path: string
  /** Adresse derselben Seite in der gewünschten Sprache. */
  hrefFor: (lang: Lang) => string
  /** Baut einen internen Link in der Sprache der laufenden Seite. */
  localize: (path: string) => string
}

const FALLBACK: LangContextValue = {
  lang: 'en',
  path: '/',
  hrefFor: lang => localePath(lang, '/'),
  localize: path => path,
}

const LangContext = createContext<LangContextValue>(FALLBACK)

/**
 * Globaler Sprach-Context.
 *
 * Seit dem 22.08.2026 gibt es kein `setLang` mehr. Die Sprache steht im Pfad,
 * ein Wechsel ist eine Navigation und kein Zustand.
 *
 * **Seit dem 23.08.2026 ist die Adressleiste die Quelle, nicht mehr die Props.**
 * Das Root-Layout ist von jeder Seite geteilt, und Next rendert ein geteiltes
 * Layout bei einer Navigation im Client **nicht** neu. Die Werte aus
 * `getRequestLang()` beschreiben deshalb für immer den Seitenaufruf, mit dem
 * die Sitzung begonnen hat. Wer auf `/de/packages` weiterklickte, bekam Links
 * ohne `/de` und landete wieder auf Englisch.
 *
 * Die Props bleiben als Startwert: sie tragen den Server-Render und die
 * Hydration, damit beide Seiten der Grenze dasselbe Markup erzeugen. Erst
 * danach übernimmt der Pfad.
 */
export function LangProvider({
  lang: initialLang, path: initialPath, children,
}: {
  lang: Lang
  path: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hydrated = useHydrated()

  // Vor der Hydration die Server-Werte, danach die Adressleiste. `usePathname`
  // liefert server-seitig den **umgeschriebenen** Pfad (`/packages`), im
  // Browser aber den echten (`/de/packages`) — ohne diesen Riegel wäre das ein
  // Hydration-Unterschied und React würfe den Teilbaum weg.
  const fromUrl = splitLangPath(pathname || initialPath)
  const lang = hydrated ? fromUrl.lang : initialLang
  const path = hydrated ? fromUrl.path : initialPath

  // `<html lang>` steht im Root-Layout und wird aus demselben Grund nie neu
  // gerendert. Damit Attribut und Adresse nie auseinanderlaufen, wird es hier
  // nachgezogen. Kein State, nur ein DOM-Attribut.
  useEffect(() => {
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang
    }
  }, [lang])

  const value: LangContextValue = {
    lang,
    path,
    hrefFor: target => localePath(target, path),
    localize: target => localePath(lang, target),
  }

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  return useContext(LangContext)
}
