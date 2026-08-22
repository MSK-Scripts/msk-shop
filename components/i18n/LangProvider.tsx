'use client'

import { createContext, useContext } from 'react'
import type { Lang } from '@/lib/i18n'
import { localePath } from '@/lib/lang'

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
 * ein Wechsel ist eine Navigation und kein Zustand: `hrefFor('de')` liefert die
 * Adresse derselben Seite auf Deutsch, der Umschalter ist ein Link darauf.
 *
 * Vorher setzte er ein Cookie und rief `router.refresh()`. Damit gab es zwei
 * Quellen für dieselbe Frage, und die Adresse in der Leiste sagte nichts über
 * die Sprache aus, die man gerade las.
 */
export function LangProvider({
  lang, path, children,
}: {
  lang: Lang
  path: string
  children: React.ReactNode
}) {
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
