'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Lang } from '@/lib/i18n'
import { setLangCookie } from '@/lib/lang'

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => {} })

/**
 * Globaler Sprach-Context. Wird im Root-Layout mit der server-seitig aus dem
 * `msk_lang`-Cookie (bzw. Accept-Language) aufgelösten Sprache initialisiert,
 * sodass SSR und Client-First-Render identisch sind (kein Hydration-Mismatch).
 *
 * `setLang`:
 *   1. aktualisiert den Context → alle Client-Komponenten schalten SOFORT um,
 *   2. persistiert die Wahl im Cookie,
 *   3. `router.refresh()` re-rendert die Server-Komponenten (z. B. die
 *      server-gerenderte Giveaway-Ergebnisseite, `<html lang>`) mit dem neuen
 *      Cookie — OHNE Client-State zu verlieren (kein Full-Reload).
 */
export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initial)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    setLangCookie(next)
    router.refresh()
  }, [router])

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  return useContext(LangContext)
}
