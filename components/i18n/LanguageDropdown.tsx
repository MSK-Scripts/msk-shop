'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useLang } from './LangProvider'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
] as const

/** Single global language switcher — lives in the Header (top right). */
export function LanguageDropdown() {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const current = languages.find(l => l.code === lang) ?? languages[0]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
      >
        <span aria-hidden>{current.flag}</span>
        {/* Label erst ab lg — auf Mobile/Tablet kompakt (nur Flagge), damit die
            Action-Leiste im sm–md-Bereich nicht überläuft. */}
        <span className="hidden font-medium lg:inline">{current.label}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl"
          >
            {languages.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false) }}
                role="menuitem"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-colors',
                  lang === l.code
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                )}
              >
                <span aria-hidden>{l.flag}</span>
                <span>{l.label}</span>
                {lang === l.code && <Check className="ml-auto h-3 w-3 text-[var(--color-primary)]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
