'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CaretDown, CircleNotch, SignIn, SignOut, User } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { ThemeSwitch } from '@/components/theme/ThemeSwitch'
import { useLang } from '@/components/i18n/LangProvider'
import { useDismiss } from '@/components/layout/useDismiss'
import { layoutTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface AccountState {
  /** CFX.re name of the shop login, null when signed out. */
  username: string | null
  signingIn: boolean
  signIn: () => void
  signOut: () => void
}

/**
 * What the account entry holds, shared by the panel in the header bar and the
 * mobile menu (plan 5.3): the shop login (CFX.re, through Tebex), the bot
 * dashboards with their own Discord login, and the appearance switch.
 *
 * The two logins are listed apart on purpose. They are separate sessions,
 * and one entry that said "signed in" for both would be wrong half the time.
 */
export function AccountSections({ account, onNavigate }: { account: AccountState; onNavigate?: () => void }) {
  const { lang } = useLang()
  const t = layoutTranslations[lang]
  // The sections render twice (header panel and mobile menu), so their
  // label ids must not be fixed strings.
  const id = useId()

  return (
    <div className="grid gap-5">
      <div role="group" aria-labelledby={`${id}-shop`} className="grid gap-2">
        <p id={`${id}-shop`} className="kicker">{t.account_shop}</p>
        {account.username ? (
          <>
            <p className="text-small text-[var(--color-muted-foreground)]">
              {t.account_signed_in.replace('{name}', account.username)}
            </p>
            <Button variant="outline" onClick={account.signOut} className="justify-start">
              <SignOut className="h-4 w-4" />
              {t.action_logout}
            </Button>
          </>
        ) : (
          <Button onClick={account.signIn} disabled={account.signingIn} className="justify-start">
            {account.signingIn ? <CircleNotch className="h-4 w-4 animate-spin" /> : <SignIn className="h-4 w-4" />}
            {t.action_login}
          </Button>
        )}
      </div>

      <div role="group" aria-labelledby={`${id}-bots`} className="grid gap-1">
        <p id={`${id}-bots`} className="kicker">{t.nav_discord}</p>
        <p className="text-small text-[var(--color-muted-foreground)]">{t.account_bots_hint}</p>
        <ul className="mt-1 grid">
          {[
            { href: '/dashboard/ticket-bot',   label: t.account_ticket_dashboard },
            { href: '/dashboard/giveaway-bot', label: t.account_giveaway_dashboard },
          ].map(l => (
            <li key={l.href}>
              {/* Session-dependent pages that may answer with redirect():
                  not prefetched, or the router cache would replay a redirect
                  decided while signed out. */}
              <Link
                href={l.href}
                prefetch={false}
                onClick={onNavigate}
                className="flex min-h-11 items-center rounded-md px-3 font-medium text-[var(--color-foreground)] transition-colors duration-150 hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div role="group" aria-labelledby={`${id}-theme`} className="grid gap-2">
        <p id={`${id}-theme`} className="kicker">{t.action_theme}</p>
        <ThemeSwitch />
      </div>
    </div>
  )
}

/** The account entry in the header bar: "Sign in" or the CFX.re name, with the panel below. */
export function AccountMenu({ account, className }: { account: AccountState; className?: string }) {
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
        aria-controls="account-panel"
        className="inline-flex min-h-11 max-w-[14rem] items-center gap-1.5 rounded-md px-2 font-medium text-[var(--color-foreground)] transition-colors duration-150 hover:text-[var(--color-primary)]"
      >
        <User className="h-5 w-5 shrink-0" />
        {account.username ? (
          <>
            <span className="sr-only">{t.account_label}: </span>
            <span className="truncate">{account.username}</span>
          </>
        ) : (
          <span>{t.action_login}</span>
        )}
        <CaretDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <div
        id="account-panel"
        hidden={!open}
        className="absolute right-0 top-full z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-card-hover)]"
      >
        <AccountSections account={account} onNavigate={() => setOpen(false)} />
      </div>
    </div>
  )
}
