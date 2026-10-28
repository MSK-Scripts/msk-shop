'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { useLang } from '@/components/i18n/LangProvider'
import { LanguageLinks } from '@/components/i18n/LanguageDropdown'
import { ThemeSwitch, type ThemeSwitchLabels } from '@/components/theme/ThemeSwitch'
import { ArrowLeft, List, Lock, SignOut, X, type IconComponent } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * One app shell for the three dashboards (plan 6.3): ticket bot, giveaway
 * bot and admin.
 *
 * - A top bar with the MSK green stripe, the product name and, below the
 *   sidebar breakpoint, the menu button and the title of the current page.
 * - A sidebar with labelled groups, the server switcher at the top and
 *   appearance, language, account and the way back to the website at the
 *   bottom (the Umami pattern).
 * - Below 64rem the sidebar becomes a drawer on the native `<dialog>`: focus
 *   trap, Escape and the inert page come from the browser, and no `<style>`
 *   is injected at runtime (nonce CSP). The bot dashboards also get their four
 *   most used areas as a bar at the bottom, because hidden navigation is found
 *   about half as often.
 * - Without `nav` the shell is the signed-out frame: top bar, content, and
 *   appearance and language in a bar below.
 *
 * The shell renders the one `<main id="main">` the skip link points to.
 */

export interface ShellNavItem {
  /** Stable id; the current item is matched on it or on the address. */
  id: string
  /** Internal path (LocaleLink adds the language). */
  href: string
  label: string
  icon: IconComponent
  /** Also in the bar at the bottom of a phone. At most four per dashboard. */
  mobile?: boolean
  /**
   * Why the area is closed to this person, "Needs Manage coupons". The entry
   * stays in the list as text with a lock and the reason below it, and is no
   * link (plan 6.6, Ticket Tool: locked areas stay visible and name what they
   * need, in words and not only on hover).
   */
  locked?: string
}

export interface ShellNavGroup {
  id: string
  /** Groups without a label come first and need none (Overview). */
  label?: string
  items: ShellNavItem[]
}

export interface ShellCopy {
  /** Name of the sidebar navigation landmark. */
  nav: string
  /** Name of the bottom bar landmark on a phone. */
  mobileNav: string
  menuOpen: string
  menuClose: string
  backToSite: string
  signOut: string
  language: string
  theme?: ThemeSwitchLabels
}

export interface ShellAccount {
  name: string
  detail?: ReactNode
  onSignOut: () => void
}

interface AppShellProps {
  productName: string
  productIcon: IconComponent
  /** Internal path the product name links to (the overview). */
  homeHref: string
  nav?: ShellNavGroup[]
  /** Current item by id. Without it the item whose href is the current path. */
  currentId?: string
  /**
   * Called before a sidebar link navigates. The admin uses it to switch its
   * panel without a server round trip; the link keeps its href for a middle
   * click or "open in new tab".
   */
  onNavigate?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
  /** Title of the page, shown in the top bar below the sidebar breakpoint. */
  pageTitle?: string
  switcher?: ReactNode
  account?: ShellAccount
  /** Language links make no sense on an English-only page (the admin). */
  showLanguage?: boolean
  copy: ShellCopy
  children: ReactNode
}

const navItemClass = cn(
  'flex min-h-11 items-center gap-3 rounded-md px-3 text-[var(--color-foreground)] transition-colors duration-150',
  'hover:bg-[var(--color-muted)]',
  // Current page: soft accent surface, green label (4.88:1 light, 6.29:1
  // dark) and a bar on the inline start, so it is not told by colour alone.
  'aria-[current=page]:bg-[var(--color-accent-soft)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--color-primary)]',
  'aria-[current=page]:shadow-[inset_3px_0_0_var(--color-primary)]',
)

function useCurrentId(nav: ShellNavGroup[] | undefined, currentId: string | undefined): string | undefined {
  // The internal path from the language provider: the server value until
  // hydration, the address bar afterwards, so both renders agree.
  const { path } = useLang()
  if (currentId) return currentId
  return nav?.flatMap(g => g.items).find(item => item.href === path)?.id
}

function NavList({
  nav, current, onNavigate, onAfterNavigate, label,
}: {
  nav: ShellNavGroup[]
  current: string | undefined
  onNavigate?: AppShellProps['onNavigate']
  onAfterNavigate?: () => void
  label: string
}) {
  return (
    <nav aria-label={label} className="grid gap-5">
      {nav.map(group => (
        <div key={group.id} className="grid gap-1">
          {group.label && (
            <h2 className="px-3 text-label font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
              {group.label}
            </h2>
          )}
          <ul className="grid gap-0.5">
            {group.items.map(({ id, href, label: itemLabel, icon: Icon, locked }) => (
              <li key={id}>
                {locked ? (
                  <div className="flex min-h-11 items-start gap-3 rounded-md px-3 py-2 text-[var(--color-muted-foreground)]">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0" />
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate">{itemLabel}</span>
                      <span className="text-small leading-snug">{locked}</span>
                    </span>
                  </div>
                ) : (
                  <Link
                    href={href}
                    prefetch={false}
                    aria-current={current === id ? 'page' : undefined}
                    onClick={event => {
                      onNavigate?.(id, event)
                      onAfterNavigate?.()
                    }}
                    className={navItemClass}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 truncate">{itemLabel}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter({ account, copy, showLanguage }: Pick<AppShellProps, 'account' | 'copy' | 'showLanguage'>) {
  return (
    <div className="@container grid gap-4 border-t border-[var(--color-border)] pt-4">
      {/* The three choices share the width. In a narrow sidebar the icons give
          way to the words, which carry the meaning. */}
      <ThemeSwitch labels={copy.theme} className="w-full [&>button]:flex-1 [&>button]:px-1.5 @max-[17rem]:[&_svg]:hidden" />
      {showLanguage && (
        <div className="grid gap-1">
          <h2 className="px-3 text-label font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
            {copy.language}
          </h2>
          <LanguageLinks className="grid gap-0.5" />
        </div>
      )}
      {account && (
        <div className="grid gap-2 rounded-md bg-[var(--color-muted)] p-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{account.name}</p>
            {account.detail && <div className="text-small text-[var(--color-muted-foreground)]">{account.detail}</div>}
          </div>
          <button
            type="button"
            onClick={account.onSignOut}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border-[1.5px] border-[var(--color-input)] bg-[var(--color-card)] px-3 font-semibold',
              'transition-colors duration-150 hover:border-[var(--color-foreground)]',
            )}
          >
            <SignOut className="h-4 w-4" />
            {copy.signOut}
          </button>
        </div>
      )}
      {/* A document request on purpose: the public site has a layout of its
          own, and the way back should not keep any dashboard state. */}
      <Link href="/" prefetch={false} className={navItemClass}>
        <ArrowLeft className="h-5 w-5 shrink-0" />
        {copy.backToSite}
      </Link>
    </div>
  )
}

function SidebarBody(props: {
  nav: ShellNavGroup[]
  current: string | undefined
  switcher?: ReactNode
  onNavigate?: AppShellProps['onNavigate']
  onAfterNavigate?: () => void
} & Pick<AppShellProps, 'account' | 'copy' | 'showLanguage'>) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-3">
      {props.switcher}
      <NavList
        nav={props.nav}
        current={props.current}
        onNavigate={props.onNavigate}
        onAfterNavigate={props.onAfterNavigate}
        label={props.copy.nav}
      />
      <div className="mt-auto">
        <SidebarFooter account={props.account} copy={props.copy} showLanguage={props.showLanguage} />
      </div>
    </div>
  )
}

/** The sidebar as a modal drawer below the breakpoint. Its content mounts only while it is open. */
function NavDrawer({ open, onClose, children, closeLabel, title }: {
  open: boolean
  onClose: () => void
  children: ReactNode
  closeLabel: string
  title: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className={cn(
        // Full height at the inline start, at most 22rem and never wider than
        // the window minus a strip to tap out of it.
        'm-0 h-dvh max-h-none w-[min(22rem,calc(100vw-3rem))] max-w-none overflow-y-auto overscroll-contain',
        'border-r border-[var(--color-border)] bg-[var(--color-card)] p-0 text-[var(--color-card-foreground)]',
        'backdrop:bg-black/50',
      )}
    >
      {open && (
        <div className="flex min-h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-t-4 border-b-[var(--color-border)] border-t-[var(--color-brand)] bg-[var(--color-card)] px-4 py-2">
            <span className="font-display text-lead font-bold">{title}</span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-[var(--color-muted)]"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{closeLabel}</span>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function AppShell({
  productName, productIcon: ProductIcon, homeHref, nav, currentId, onNavigate,
  pageTitle, switcher, account, showLanguage = true, copy, children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const current = useCurrentId(nav, currentId)
  const mobileItems = (nav ?? []).flatMap(g => g.items).filter(i => i.mobile && !i.locked).slice(0, 4)
  const signedIn = Boolean(nav)

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-t-4 border-b-[var(--color-border)] border-t-[var(--color-brand)] bg-[var(--color-card)]">
        <div className="flex min-h-[var(--app-topbar)] items-center gap-2 px-[var(--app-gutter)]">
          {signedIn && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-haspopup="dialog"
              className="-ml-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-[var(--color-muted)] lg:hidden"
            >
              <List className="h-6 w-6" />
              <span className="sr-only">{copy.menuOpen}</span>
            </button>
          )}
          <Link href={homeHref} prefetch={false} className="flex min-h-11 min-w-0 shrink-0 items-center gap-2.5 text-[var(--color-foreground)]">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-md object-contain" />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="sr-only font-display font-bold [font-stretch:108%] sm:not-sr-only">MSK Scripts</span>
              <span className="inline-flex items-center gap-1.5 font-display text-lead font-bold">
                <ProductIcon className="hidden h-5 w-5 text-[var(--color-primary)] sm:inline" />
                {productName}
              </span>
            </span>
          </Link>
          {pageTitle && (
            // The page title stays visible on a phone, where the sidebar is
            // folded away (plan 6.3). On wide screens the page header says it.
            <span className="ml-1 min-w-0 truncate border-l border-[var(--color-border)] pl-3 text-[var(--color-muted-foreground)] lg:hidden">
              {pageTitle}
            </span>
          )}
        </div>
      </header>

      {signedIn && nav ? (
        <div className="flex flex-1">
          <aside className="sticky top-[calc(var(--app-topbar)+5px)] hidden h-[calc(100dvh-var(--app-topbar)-5px)] w-[var(--app-sidebar)] shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-card)] lg:flex">
            <SidebarBody
              nav={nav}
              current={current}
              switcher={switcher}
              onNavigate={onNavigate}
              account={account}
              copy={copy}
              showLanguage={showLanguage}
            />
          </aside>

          <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} closeLabel={copy.menuClose} title={productName}>
            <SidebarBody
              nav={nav}
              current={current}
              switcher={switcher}
              onNavigate={onNavigate}
              onAfterNavigate={() => setDrawerOpen(false)}
              account={account}
              copy={copy}
              showLanguage={showLanguage}
            />
          </NavDrawer>

          <main
            id="main"
            tabIndex={-1}
            className={cn(
              'min-w-0 flex-1 px-[var(--app-gutter)] py-[var(--app-gutter-y)]',
              mobileItems.length > 0 && 'pb-[calc(var(--app-tabbar)+var(--app-gutter-y))] lg:pb-[var(--app-gutter-y)]',
            )}
          >
            <div className="@container mx-auto w-full max-w-[var(--app-content)]">{children}</div>
          </main>
        </div>
      ) : (
        <>
          <main id="main" tabIndex={-1} className="flex-1 px-[var(--app-gutter)] py-[var(--app-gutter-y)]">
            <div className="@container mx-auto w-full max-w-[var(--app-content)]">{children}</div>
          </main>
          <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[var(--app-gutter)] py-3">
              <ThemeSwitch labels={copy.theme} />
              {showLanguage && (
                <nav aria-label={copy.language}>
                  <LanguageLinks className="flex gap-1" />
                </nav>
              )}
              <Link href="/" prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-[var(--color-primary)] hover:underline">
                <ArrowLeft className="h-4 w-4" />
                {copy.backToSite}
              </Link>
            </div>
          </footer>
        </>
      )}

      {mobileItems.length > 0 && (
        <nav
          aria-label={copy.mobileNav}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-card)] pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        >
          <ul className="grid h-[var(--app-tabbar)] auto-cols-fr grid-flow-col">
            {mobileItems.map(({ id, href, label, icon: Icon }) => (
              <li key={id} className="min-w-0">
                <Link
                  href={href}
                  prefetch={false}
                  aria-current={current === id ? 'page' : undefined}
                  onClick={event => onNavigate?.(id, event)}
                  className={cn(
                    'flex h-full min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-label font-semibold text-[var(--color-muted-foreground)]',
                    'aria-[current=page]:text-[var(--color-primary)] aria-[current=page]:shadow-[inset_0_3px_0_var(--color-primary)]',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="w-full truncate text-center">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
