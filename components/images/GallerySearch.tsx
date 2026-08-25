'use client'

import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useLang } from '@/components/i18n/LangProvider'
import { Input } from '@/components/ui/Input'
import { imagesTranslations, type Lang } from '@/lib/i18n'

/**
 * Suchfeld der Kategorieseite.
 *
 * Die Suche lebt in der URL, nicht in einer Komponente: `?q=zent` ist teilbar,
 * ueberlebt den Zurueck-Knopf und wird serverseitig gerendert. Dieses Feld ist
 * deshalb nur die Eingabe, die Ergebnisliste kommt aus der Server-Komponente.
 *
 * Kein `setState` in einem Effect, die Regel steht im Projekt auf `error`:
 * der Abgleich mit der URL passiert waehrend des Renders nach dem
 * React-Muster fuer abgeleiteten State, und der Timer laeuft im Handler.
 */
export function GallerySearch({
  lang, slug, initialQuery,
}: {
  lang:         Lang
  slug:         string
  initialQuery: string
}) {
  const t = imagesTranslations[lang]
  const router = useRouter()
  const { localize } = useLang()

  const [typed, setTyped] = useState(initialQuery)
  // Merkt sich, welchen URL-Wert dieses Feld zuletzt gesehen hat. Aendert er
  // sich durch eine Navigation (Zurueck-Knopf, Kategoriewechsel), zieht die
  // Eingabe nach, ohne dass ein Effect noetig waere.
  const [lastFromUrl, setLastFromUrl] = useState(initialQuery)
  if (initialQuery !== lastFromUrl) {
    setLastFromUrl(initialQuery)
    setTyped(initialQuery)
  }

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function navigate(value: string) {
    const query = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ''
    // localize(), damit ein deutscher Besucher nicht bei jedem Tastendruck
    // auf die englische Adresse geworfen wird.
    router.push(localize(`/images/${slug}${query}`))
  }

  function onChange(value: string) {
    setTyped(value)
    if (timer.current) clearTimeout(timer.current)
    // 250 ms: kurz genug, dass es sofort wirkt, lang genug, dass nicht jeder
    // Buchstabe eine Serveranfrage ausloest.
    timer.current = setTimeout(() => navigate(value), 250)
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current)
    setTyped('')
    navigate('')
  }

  return (
    <div className="relative max-w-md">
      <label htmlFor="gallery-search" className="sr-only">{t.search_label}</label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        aria-hidden="true"
      />
      <Input
        id="gallery-search"
        type="search"
        value={typed}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.search_placeholder}
        className="pl-9 pr-9"
        autoComplete="off"
      />
      {typed && (
        <button
          type="button"
          onClick={clear}
          aria-label={t.clear_search}
          className="tap-target absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
