'use client'

import { useCallback, useRef, useState } from 'react'
import { CaretDown, Translate as Languages } from '@/components/icons'
import { useDismiss } from '@/components/layout/useDismiss'
import { useLang } from './LangProvider'
import { layoutTranslations } from '@/lib/i18n'
import { LANG_COOKIE } from '@/lib/routes'
import { cn } from '@/lib/utils'

/**
 * Stores the language a visitor chose here, so that `/` opens in it next
 * time. This click is the only place the cookie is written: the language
 * is in the address anyway, and the privacy policy promises no language
 * cookie without the visitor's own choice.
 */
function rememberLanguage(lang: string): void {
  document.cookie = `${LANG_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const

/**
 * The two language versions of the current page as plain links.
 *
 * Deliberately `<a>` instead of `next/link`: the switch changes the root
 * segment `[lang]`, and a document request lets the server render everything
 * anew, including title and `<html lang>`. A real link also keeps middle
 * click, "open in new tab" and the back button working. It costs one page
 * load at a place used at most once per visit.
 */
export function LanguageLinks({ onChoose, className }: { onChoose?: () => void; className?: string }) {
  const { lang, hrefFor } = useLang()
  return (
    <ul className={className}>
      {languages.map(l => (
        <li key={l.code}>
          <a
            href={hrefFor(l.code)}
            hrefLang={l.code}
            lang={l.code}
            aria-current={lang === l.code ? 'true' : undefined}
            onClick={() => { rememberLanguage(l.code); onChoose?.() }}
            className={cn(
              'flex min-h-11 items-center justify-between gap-4 rounded-md px-3 text-[var(--color-foreground)] transition-colors duration-150',
              'hover:bg-[var(--color-muted)] aria-[current=true]:font-semibold aria-[current=true]:text-[var(--color-primary)]',
            )}
          >
            <span>{l.label}</span>
            <span className="text-small uppercase text-[var(--color-muted-foreground)]">{l.code}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Language switcher in the header bar: the current language as a short code,
 * a small panel with both versions below it.
 *
 * A disclosure (button plus panel) rather than an ARIA menu: a menu promises
 * arrow-key handling, and two links do not need it. Deliberately a hand-made
 * panel instead of Radix: the strict nonce CSP blocks the `<style>` tags that
 * Radix injects at runtime (its scroll lock).
 */
export function LanguageDropdown({ className }: { className?: string }) {
  const { lang } = useLang()
  const t = layoutTranslations[lang]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback((reason: 'outside' | 'escape') => {
    setOpen(false)
    if (reason === 'escape') buttonRef.current?.focus()
  }, [])
  useDismiss(open, ref, close)

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="language-panel"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-medium text-[var(--color-foreground)] transition-colors duration-150 hover:text-[var(--color-primary)]"
      >
        <Languages className="h-5 w-5" />
        <span className="sr-only">{t.action_language} </span>
        <span className="uppercase">{lang}</span>
        <CaretDown className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <div
        id="language-panel"
        hidden={!open}
        className="absolute right-0 top-full z-[60] mt-2 min-w-[12rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-card-hover)]"
      >
        <LanguageLinks onChoose={() => setOpen(false)} />
      </div>
    </div>
  )
}
