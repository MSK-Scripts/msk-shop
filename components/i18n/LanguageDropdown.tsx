'use client'

import { useEffect, useRef, useState } from 'react'
import { Languages } from 'lucide-react'
import { useLang } from './LangProvider'
import { Button } from '@/components/ui/Button'
import { layoutTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
] as const

/**
 * Single global language switcher — lives in the Header (top right).
 *
 * Icon-only trigger plus a small menu (same look as the theme menu next to it).
 * Bewusst ein eigenes useState-Dropdown statt Radix: die strikte Nonce-CSP
 * blockt zur Laufzeit injizierte <style>-Tags (Radix' Scroll-Lock).
 */
export function LanguageDropdown() {
  const { lang, hrefFor } = useLang()
  const t = layoutTranslations[lang]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        className="shrink-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.action_language}
        title={t.action_language}
      >
        <Languages className="h-4 w-4" />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[60] mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl"
        >
          {languages.map(l => (
            // Ein echter Link, kein Knopf: der Sprachwechsel ist eine
            // Navigation zur Gegenstueck-URL. Damit greifen Mittelklick,
            // "in neuem Tab oeffnen" und der Zurueck-Knopf.
            //
            // Bewusst `<a>` statt `next/link`: beide Adressen zeigen nach dem
            // Rewrite auf denselben Routenbaum (`/de/packages` wird intern zu
            // `/packages`). Der Client-Router sieht deshalb keinen
            // Segmentwechsel und rendert weder Seite noch Layout neu — die
            // Adresse wechselte, der Text blieb englisch. Ein Dokument-Request
            // laesst den Server alles neu rendern, inklusive Titel und
            // `<html lang>`. Das kostet einmal Ladezeit an einer Stelle, die
            // man hoechstens einmal pro Besuch benutzt.
            <a
              key={l.code}
              href={hrefFor(l.code)}
              role="menuitem"
              hrefLang={l.code}
              aria-current={lang === l.code ? 'true' : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                'flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-sm outline-none transition-colors',
                'hover:bg-[var(--color-muted)] focus-visible:bg-[var(--color-muted)]',
                lang === l.code
                  ? 'font-medium text-[var(--color-primary)]'
                  : 'text-[var(--color-foreground)]',
              )}
            >
              <span>{l.label}</span>
              <span className="font-mono text-xs uppercase">{l.code}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
