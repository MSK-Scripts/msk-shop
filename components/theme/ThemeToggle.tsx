'use client'

import { useEffect, useRef, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLang } from '@/components/i18n/LangProvider'
import { Button } from '@/components/ui/Button'
import { layoutTranslations } from '@/lib/i18n'
import { useHydrated } from '@/lib/useHydrated'
import { cn } from '@/lib/utils'

/**
 * Theme-Menü — Light / Dark / System.
 *
 * Das Icon zeigt `resolvedTheme` (nie `'system'`/`undefined`), der Haken im
 * Menü hängt an `theme` — damit bleibt „Systemeinstellung“ als Auswahl sichtbar.
 * Vor der Hydration rendert ein Platzhalter gleicher Größe ohne Icon, sonst
 * gäbe es einen Hydration-Mismatch. Der Guard kommt aus `useHydrated()`
 * (useSyncExternalStore) statt aus einem setState im Effect.
 *
 * Bewusst ein eigenes useState-Dropdown statt Radix: die strikte Nonce-CSP
 * blockt zur Laufzeit injizierte <style>-Tags (Radix' Scroll-Lock).
 */
export function ThemeToggle() {
  const { lang } = useLang()
  const t = layoutTranslations[lang]
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useHydrated()
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

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t.action_theme}>
        {/* Platzhalter — selbe Größe, kein Icon → kein Hydration-Mismatch */}
        <span className="block h-4 w-4" />
      </Button>
    )
  }

  const items = [
    { value: 'light',  label: t.theme_light,  icon: Sun },
    { value: 'dark',   label: t.theme_dark,   icon: Moon },
    { value: 'system', label: t.theme_system, icon: Monitor },
  ] as const

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        className="h-8 w-8 shrink-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.action_theme}
        title={t.action_theme}
      >
        {resolvedTheme === 'dark'
          ? <Moon className="h-4 w-4" />
          : <Sun className="h-4 w-4" />}
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-[60] mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl"
        >
          {items.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitem"
              onClick={() => { setTheme(value); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors',
                'hover:bg-[var(--color-muted)] focus-visible:bg-[var(--color-muted)]',
                theme === value
                  ? 'font-medium text-[var(--color-primary)]'
                  : 'text-[var(--color-foreground)]',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
