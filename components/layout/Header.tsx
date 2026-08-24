'use client'

import { Fragment, Suspense, useEffect, useRef, useState } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import Image from 'next/image'
import { useSearchParams, usePathname } from 'next/navigation'
import {
  ShoppingCart, Menu, X, User, LogOut, Loader2, ChevronDown, Search, ArrowRight, ExternalLink,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useCart } from '@/lib/useCart'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LanguageDropdown } from '@/components/i18n/LanguageDropdown'
import { useLang } from '@/components/i18n/LangProvider'
import { layoutTranslations } from '@/lib/i18n'
import { SearchDialog } from '@/components/search/SearchDialog'
import { getCategories } from '@/lib/tebex'
import { useHydrated } from '@/lib/useHydrated'
import type { TebexCategory } from '@/types/tebex'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  /**
   * Externe Links werden anhand der `href` automatisch erkannt (http/https)
   * und öffnen in einem neuen Tab (target="_blank"). `external` kann gesetzt
   * werden, um das Verhalten explizit zu erzwingen.
   */
  external?: boolean
  /**
   * Prefetch ist standardmäßig an. Für **auth-gated** Routen (verify/dashboard),
   * die server-seitig je nach Session-Cookie ein `redirect()` zurückgeben, MUSS
   * Prefetch aus sein: sonst cached der Next.js-Router-Cache die Redirect-
   * Entscheidung aus dem ausgeloggten/alten Zustand und spielt sie bei Soft-
   * Navigation ab (Dashboard → verify ohne Reload; verify erst nach Reload
   * aktuell). Default `true`, wenn nicht gesetzt.
   */
  prefetch?: boolean
  /**
   * Unterpunkte. Ist dies gesetzt, wird der Eintrag auf dem Desktop beim
   * Hovern (oder per Tastatur-Fokus) zu einem Dropdown — der Haupt-Link
   * bleibt klickbar. Auf Mobile werden die Unterpunkte eingerückt gelistet.
   */
  children?: NavItem[]
  /**
   * Zwischenüberschrift **vor** diesem Unterpunkt. Damit trägt ein Dropdown
   * mehrere Produkte, ohne dass jedes einen eigenen Platz in der Leiste
   * braucht — das „Bots"-Menü führt so beide Bots samt Unterseiten.
   */
  section?: string
  /**
   * Hängt die live aus Tebex geladenen Kategorien in dieses Dropdown ein.
   */
  withCategories?: boolean
}

/**
 * Vier Einträge, bewusst wenige.
 *
 * Vorher standen hier sieben Punkte (Home, Kategorien, Ticket Bot, Giveaway Bot,
 * Resource Stats, Dokumentation) nebeneinander. Der Header brauchte damit auf
 * Deutsch bis zu 1333 px Inhaltsbreite, schaltete die Desktop-Leiste aber schon
 * bei `md` (768 px) ein — die Seite scrollte deshalb zwischen 768 und rund
 * 1345 px seitlich, also auf 1024er-, 1280er- und 1366er-Laptops. Weniger
 * Einträge plus der höhere Umbruchpunkt weiter unten beheben das.
 *
 * „Home" entfällt, das Logo führt bereits dorthin.
 */
const NAV_ITEMS: NavItem[] = [
  { label: "Packages", href: "/packages", withCategories: true },
  {
    label: "Bots",
    href: "/ticketbot",
    children: [
      // verify/dashboard sind session-abhängig + können redirect() liefern →
      // nicht prefetchen (sonst stale Redirect aus dem Router-Cache).
      { label: "Overview", href: "/ticketbot", section: "Ticket Bot" },
      { label: "Verify", href: "/ticketbot/verify", prefetch: false },
      { label: "Dashboard", href: "/ticketbot/dashboard", prefetch: false },
      { label: "Statistics", href: "/ticketbot/stats" },
      { label: "Overview", href: "/giveaway", section: "Giveaway Bot" },
      { label: "Dashboard", href: "/giveaway/dashboard", prefetch: false },
      { label: "Statistics", href: "/giveaway/stats" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Documentation", href: "https://docu.msk-scripts.de" },
      { label: "Resource Stats", href: "/resources" },
      { label: "GitHub", href: "https://github.com/MSK-Scripts" },
    ],
  },
  { label: "Support", href: "https://discord.msk-scripts.de/" },
];

function HeaderInner() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [categories, setCategories] = useState<TebexCategory[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const { lang, path: langlosPath } = useLang()
  const t = layoutTranslations[lang]
  // Nav-Labels übersetzen; Marken-/Produktnamen (Ticket Bot, Giveaway Bot,
  // Dashboard) bleiben bewusst unverändert (kein Mapping-Eintrag → Fallback).
  const navLabel = (label: string): string => ({
    'Home':           t.nav_home,
    'Packages':       t.nav_packages,
    'Bots':           t.nav_bots,
    'Resources':      t.nav_resource_group,
    'Support':        t.nav_support,
    'Overview':       t.nav_overview,
    'Verify':         t.nav_verify,
    'Dashboard':      t.nav_dashboard,
    'Statistics':     t.nav_statistics,
    'Resource Stats': t.nav_resources,
    'Documentation':  t.nav_documentation,
  } as Record<string, string>)[label] ?? label

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { itemCount, loginAndAdd, refreshBasket, processPendingPackage } = useCart()
  const { openCart, username, clearBasket } = useCartStore()

  const userMenuRef = useRef<HTMLDivElement>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Hydration-Guard: Zustand-Stores hydratisieren im Client async aus
  // localStorage. Damit SSR (alle Defaults) und Client-First-Render
  // identisch bleiben (sonst → Hydration-Mismatch → React hängt keine
  // Event-Listener mehr an die Subtree → tote Buttons), zeigen wir
  // persistierte Werte erst nach dem Mount.
  const hydrated = useHydrated()

  // Shortcut-Hinweis im Such-Feld: ⌘K auf dem Mac, sonst Ctrl+K. Der
  // `hydrated`-Guard kommt zuerst, damit `navigator` server-seitig nie
  // ausgewertet wird.
  const isMac = hydrated && /mac/i.test(navigator.platform)

  // Effective-Werte: identisch zwischen SSR + Client-First-Render
  const effectiveItemCount = hydrated ? itemCount : 0
  const effectiveUsername = hydrated ? username : null

  // Tebex-Categories laden
  useEffect(() => {
    let alive = true
    getCategories()
      .then(c => { if (alive) setCategories(c) })
      .catch(err => console.error('[Header] getCategories failed:', err))
      .finally(() => { if (alive) setCategoriesLoaded(true) })
    return () => { alive = false }
  }, [])

  // OAuth-Flow Handling
  useEffect(() => {
    const justLoggedIn = searchParams.get('success') === 'true'
    const discordLinked = searchParams.get('discordLinked') === 'true'
    const discordId = searchParams.get('discord_id')

    async function init() {
      await refreshBasket()
      if (justLoggedIn) {
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
        await processPendingPackage()
      } else if (discordLinked && discordId) {
        localStorage.setItem('discordId', discordId)
        const url = new URL(window.location.href)
        url.searchParams.delete('discordLinked')
        url.searchParams.delete('discord_id')
        window.history.replaceState({}, '', url.toString())
        await processPendingPackage()
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Click-outside: Categories-Dropdown + User-Menu
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ESC schließt Categories + User-Menu
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
      }
      // ⌘K / Ctrl+K öffnet Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Menüs bei Route-Change schließen. Während des Renders angepasst statt im
  // Effect: React verwirft den Render dann direkt und committet nur den
  // geschlossenen Zustand, statt das offene Menü kurz auf der neuen Seite zu
  // zeigen.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setMobileOpen(false)
    setOpenDropdown(null)
  }

  async function handleLogin() {
    setLoginLoading(true)
    try { await loginAndAdd() }
    finally { setLoginLoading(false) }
  }

  // Gegen den Pfad OHNE Sprachpräfix vergleichen, nicht gegen die Adresse.
  // `/de/packages`.startsWith('/packages') ist falsch, deshalb war auf jeder
  // deutschen Seite kein einziger Navigationspunkt hervorgehoben.
  const isActive = (href: string) =>
    href === '/' ? langlosPath === '/' : langlosPath.startsWith(href)

  const hasCategories = categories.length > 0

  const navLinkClasses = (active: boolean) => cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-[var(--color-muted)] text-[var(--color-foreground)]'
      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
  )

  // Externe Links (http/https) öffnen in einem neuen Tab; interne Routen
  // laufen über next/link inkl. Prefetch.
  const isNavItemExternal = (item: NavItem) =>
    item.external ?? /^https?:\/\//i.test(item.href)

  const renderNavItem = (item: NavItem) =>
    isNavItemExternal(item) ? (
      <a
        key={item.href}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(navLinkClasses(false), 'inline-flex items-center gap-1')}
      >
        {navLabel(item.label)}
        <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
      </a>
    ) : (
      <Link
        key={item.href}
        href={item.href}
        prefetch
        className={navLinkClasses(isActive(item.href))}
      >
        {navLabel(item.label)}
      </Link>
    )

  // Desktop: Einträge mit `children` werden zu einem Dropdown. Hover (Maus) bzw.
  // Fokus (Tastatur) öffnet es, Maus-Verlassen schließt es. Zusätzlich schließt
  // ein Klick auf einen Unterpunkt sofort (setOpenDropdown(null)) und der
  // pathname-Effekt schließt bei jedem Routenwechsel — sonst hielte der nach der
  // Navigation noch fokussierte Link das Menü offen. Der Haupt-Link bleibt
  // klickbar; das `pt-2` überbrückt die Lücke zum Panel (liegt im Wrapper, daher
  // kein vorzeitiges mouseLeave).
  // Ein Unterpunkt im Dropdown. Externe Ziele (Doku, GitHub) laufen als <a> mit
  // target="_blank", interne über next/link.
  const renderDropdownChild = (child: NavItem, onNavigate?: () => void) => {
    const external = isNavItemExternal(child)
    const classes = cn(
      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm outline-none transition-colors',
      !external && isActive(child.href)
        ? 'bg-[var(--color-muted)] text-[var(--color-foreground)]'
        : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
    )
    const inner = (
      <>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
        {navLabel(child.label)}
        {external && <ExternalLink className="ml-auto h-3 w-3 opacity-70" aria-hidden />}
      </>
    )
    return external ? (
      <a
        key={child.href}
        href={child.href}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={onNavigate}
        className={classes}
      >
        {inner}
      </a>
    ) : (
      <Link
        key={child.href}
        href={child.href}
        prefetch={child.prefetch ?? true}
        role="menuitem"
        onClick={onNavigate}
        className={classes}
      >
        {inner}
      </Link>
    )
  }

  // Zwischenüberschrift im Dropdown, z. B. „Ticket Bot" über dessen Unterseiten.
  const sectionHeading = (label: string) => (
    <div
      key={`section-${label}`}
      className="px-3 pb-1 pt-2 font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]"
    >
      {label}
    </div>
  )

  // Die live geladenen Tebex-Kategorien, eingehängt ins „Pakete"-Dropdown.
  const renderCategoryEntries = (onNavigate?: () => void) => {
    if (!categoriesLoaded) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t.nav_loading}
        </div>
      )
    }
    if (!hasCategories) return null
    return (
      <>
        {sectionHeading(t.nav_categories)}
        {categories.map(cat =>
          renderDropdownChild({ label: cat.name, href: `/categories/${cat.id}` }, onNavigate),
        )}
      </>
    )
  }

  const renderDesktopNavItem = (item: NavItem) => {
    const hasPanel = Boolean(item.children?.length || item.withCategories)
    if (!hasPanel) return renderNavItem(item)
    const children = item.children ?? []
    const active = isActive(item.href) || children.some(c => isActive(c.href))
    const open = openDropdown === item.href
    return (
      <div
        key={item.href}
        className="relative"
        onMouseEnter={() => setOpenDropdown(item.href)}
        onMouseLeave={() => setOpenDropdown(null)}
        onFocus={() => setOpenDropdown(item.href)}
        onBlur={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenDropdown(null)
        }}
      >
        <Link
          href={item.href}
          prefetch
          className={cn(navLinkClasses(active), 'inline-flex items-center gap-1')}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {navLabel(item.label)}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </Link>
        <div
          role="menu"
          className={cn(
            'absolute left-0 top-full z-[60] pt-2 transition-all duration-150',
            open ? 'visible opacity-100' : 'invisible opacity-0',
          )}
        >
          <div className="min-w-[228px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-xl">
            {children.map(child => (
              <Fragment key={child.href}>
                {child.section && sectionHeading(child.section)}
                {renderDropdownChild(child, () => setOpenDropdown(null))}
              </Fragment>
            ))}
            {item.withCategories && (
              <>
                {renderCategoryEntries(() => setOpenDropdown(null))}
                <div className="my-1 h-px bg-[var(--color-border)]" />
                <Link
                  href="/packages"
                  prefetch
                  role="menuitem"
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[var(--color-primary)] outline-none transition-colors hover:bg-[var(--color-muted)]"
                >
                  <span>{hasCategories ? t.nav_all_packages : t.nav_browse_all}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Mobile: kein Hover — Haupt-Link plus eingerückte Unterpunkte.
  const renderMobileNavItem = (item: NavItem) => {
    const hasPanel = Boolean(item.children?.length || item.withCategories)
    if (!hasPanel) return renderNavItem(item)
    return (
      <div key={item.href}>
        {renderNavItem(item)}
        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
          {(item.children ?? []).map(child => (
            <Fragment key={child.href}>
              {child.section && sectionHeading(child.section)}
              {renderDropdownChild(child, () => setMobileOpen(false))}
            </Fragment>
          ))}
          {item.withCategories && renderCategoryEntries(() => setMobileOpen(false))}
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_85%,transparent)] backdrop-blur-md">
        {/* container-page, damit Kopfzeile, Inhalt und Fusszeile auf derselben
            Kante sitzen. Vorher w-full mit eigenem Padding, dadurch lief die
            Kopfzeile als einziges Element der Seite bis an den Bildschirmrand. */}
        <div className="container-page flex h-16 items-center gap-3">

          {/* Logo */}
          <Link
            href="/"
            className="tap-target flex shrink-0 items-center gap-2 font-bold tracking-tight transition-opacity hover:opacity-90"
            aria-label="MSK Scripts"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="hidden text-base sm:inline">MSK Scripts</span>
          </Link>

          {/* Desktop-Nav — erst ab xl (1280 px). Darunter übernimmt das
              Burger-Menü. Der frühere Umbruch bei md (768 px) war die Ursache
              des seitlichen Overflows, siehe Kommentar an NAV_ITEMS. */}
          <nav className="ml-4 hidden flex-1 items-center gap-1 xl:flex" aria-label="Primary">
            {NAV_ITEMS.map(renderDesktopNavItem)}
          </nav>
          <div className="flex-1 xl:hidden" />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search — ab lg als Input-Look, darunter Icon-only */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t.action_search}
              className="hidden h-8 min-w-[200px] items-center gap-2 rounded-md border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,transparent)] px-3 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] lg:inline-flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">{t.action_search_placeholder}</span>
              <kbd className="inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 font-mono text-[0.625rem]">
                <span>{isMac ? '⌘' : 'Ctrl'}</span>
                <span>K</span>
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="shrink-0 lg:hidden"
              aria-label={t.action_search}
              title={t.action_search}
            >
              <Search className="h-4 w-4" />
            </Button>

            <LanguageDropdown />

            <ThemeToggle />

            {/* Cart */}
            <Button
              variant="outline"
              size="sm"
              onClick={openCart}
              className="relative tap-target"
              aria-label={`Cart (${effectiveItemCount} items)`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t.action_cart}</span>
              {effectiveItemCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--color-background)] bg-[var(--color-primary)] px-1 text-[0.625rem] font-bold leading-none text-[var(--color-primary-foreground)] tabular-nums"
                >
                  {effectiveItemCount}
                </span>
              )}
            </Button>

            {/* Login / User-Menu */}
            {effectiveUsername ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserMenuOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  <User className="h-4 w-4 text-[var(--color-primary)]" />
                  <span className="max-w-[120px] truncate">{effectiveUsername}</span>
                </Button>
                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg"
                  >
                    <button
                      onClick={() => { clearBasket(); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-danger)]"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.action_logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleLogin}
                disabled={loginLoading}
                className="hidden sm:inline-flex"
              >
                {loginLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <User className="h-4 w-4" />}
                {t.action_login}
              </Button>
            )}

            {/* Mobile-Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile-Menu */}
        {mobileOpen && (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-[var(--color-border)] bg-[var(--color-background)] xl:hidden">
            <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
              {NAV_ITEMS.map(renderMobileNavItem)}

              <div className="mt-2 h-px bg-[var(--color-border)]" />

              <button
                onClick={() => { setSearchOpen(true); setMobileOpen(false) }}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <Search className="h-4 w-4" />
                {t.action_search}
              </button>

              <div className="my-2 h-px bg-[var(--color-border)]" />

              {effectiveUsername ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm">
                    <User className="h-4 w-4 text-[var(--color-primary)]" />
                    <span>{effectiveUsername}</span>
                  </div>
                  <button
                    onClick={() => clearBasket()}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-muted)]"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.action_logout}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={loginLoading}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)]"
                >
                  {loginLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <User className="h-4 w-4" />}
                  {t.action_login}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export function Header() {
  return (
    <Suspense fallback={<div className="sticky top-0 z-50 h-16 border-b border-[var(--color-border)] bg-[var(--color-background)]" />}>
      <HeaderInner />
    </Suspense>
  )
}
