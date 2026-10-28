'use client'

import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from '@/components/icons'
import { useLang } from '@/components/i18n/LangProvider'
import { layoutTranslations } from '@/lib/i18n'
import { useHydrated } from '@/lib/useHydrated'
import { cn } from '@/lib/utils'

/**
 * System, light or dark (E1: the system setting is the default).
 *
 * Three toggle buttons with `aria-pressed` instead of a menu: all choices are
 * visible at once, and a screen reader announces which one is on. It sits in
 * the account menu, the mobile menu and the footer, not as a button of its
 * own in the header bar (plan 5.3).
 *
 * The stored choice is only known in the browser, so before hydration no
 * button is pressed; the server and the first client render stay identical.
 */
export function ThemeSwitch({ tone = 'page', className }: { tone?: 'page' | 'band'; className?: string }) {
  const { lang } = useLang()
  const t = layoutTranslations[lang]
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  const current = hydrated ? (theme ?? 'system') : null

  const items = [
    { value: 'system', label: t.theme_system, Icon: Monitor },
    { value: 'light',  label: t.theme_light,  Icon: Sun },
    { value: 'dark',   label: t.theme_dark,   Icon: Moon },
  ] as const

  return (
    <div
      role="group"
      aria-label={t.action_theme}
      className={cn(
        'inline-flex w-fit overflow-hidden rounded-md border-[1.5px]',
        tone === 'band' ? 'border-[var(--color-band-muted)]' : 'border-[var(--color-input)]',
        className,
      )}
    >
      {items.map(({ value, label, Icon }, i) => (
        <button
          key={value}
          type="button"
          aria-pressed={current === value}
          onClick={() => setTheme(value)}
          className={cn(
            'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2.5 text-small font-semibold transition-colors duration-150',
            // The group clips its corners, so the ring is drawn inside.
            'focus-visible:outline-offset-[-3px]',
            i > 0 && 'border-l-[1.5px] border-inherit',
            tone === 'band'
              ? 'text-[var(--color-band-foreground)] hover:bg-[var(--color-band-line)] aria-pressed:bg-[var(--color-band-foreground)] aria-pressed:text-[var(--color-band)]'
              : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)] aria-pressed:bg-[var(--color-foreground)] aria-pressed:text-[var(--color-background)]',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
