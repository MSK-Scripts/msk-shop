'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, usePathname } from 'next/navigation'
import {
  ShoppingCart, Menu, X, User, LogOut, Loader2, ChevronDown, Search, ArrowRight,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useCart } from '@/lib/useCart'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { SearchDialog } from '@/components/search/SearchDialog'
import { getCategories } from '@/lib/tebex'
import type { TebexCategory } from '@/types/tebex'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS_PRIMARY: NavItem[] = [
  { label: 'Home',     href: '/' },
  //{ label: 'Packages', href: '/packages' },
]

const NAV_ITEMS_SECONDARY: NavItem[] = [
  //{ label: 'Stats',     href: '/stats' },
  //{ label: 'Verify',    href: '/verify' },
  { label: 'Dashboard', href: '/dashboard' },
]

function HeaderInner() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [categories, setCategories] = useState<TebexCategory[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { itemCount, loginAndAdd, refreshBasket, processPendingPackage } = useCart()
  const { openCart, username, clearBasket } = useCartStore()

  const catRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Hydration-Guard: Zustand-Stores hydratisieren im Client async aus
  // localStorage. Damit SSR (alle Defaults) und Client-First-Render
  // identisch bleiben (sonst → Hydration-Mismatch → React hängt keine
  // Event-Listener mehr an die Subtree → tote Buttons), zeigen wir
  // persistierte Werte erst nach dem Mount.
  useEffect(() => { setHydrated(true) }, [])

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
        sessionStorage.setItem('discordId', discordId)
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
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false)
      }
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
        setCatOpen(false)
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

  // Menüs bei Route-Change schließen
  useEffect(() => {
    setMobileOpen(false)
    setCatOpen(false)
  }, [pathname])

  async function handleLogin() {
    setLoginLoading(true)
    try { await loginAndAdd() }
    finally { setLoginLoading(false) }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const categoriesActive = pathname.startsWith('/categories')
  const hasCategories = categories.length > 0

  const navLinkClasses = (active: boolean) => cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-[var(--color-muted)] text-[var(--color-foreground)]'
      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
  )

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-background)_85%,transparent)] backdrop-blur-md">
        <div className="flex h-16 w-full items-center gap-3 px-4 md:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-bold tracking-tight transition-opacity hover:opacity-90"
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

          {/* Desktop-Nav */}
          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex" aria-label="Primary">
            {NAV_ITEMS_PRIMARY.map(item => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={navLinkClasses(isActive(item.href))}
              >
                {item.label}
              </Link>
            ))}

            {/* Categories-Dropdown — manuelles useState-Dropdown */}
            <div className="relative" ref={catRef}>
              <button
                type="button"
                onClick={() => setCatOpen(v => !v)}
                className={cn(
                  'inline-flex items-center gap-1',
                  navLinkClasses(categoriesActive || catOpen),
                )}
                aria-haspopup="menu"
                aria-expanded={catOpen}
              >
                Categories
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-150',
                    catOpen && 'rotate-180',
                  )}
                />
              </button>

              {catOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-[60] mt-2 min-w-[240px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-xl"
                >
                  {!categoriesLoaded ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading…
                    </div>
                  ) : hasCategories ? (
                    <>
                      {categories.map(cat => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.id}`}
                          prefetch={true}
                          role="menuitem"
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] outline-none transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                          {cat.name}
                        </Link>
                      ))}
                      <div className="my-1 h-px bg-[var(--color-border)]" />
                      <Link
                        href="/packages"
                        prefetch={true}
                        role="menuitem"
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[var(--color-primary)] outline-none transition-colors hover:bg-[var(--color-muted)]"
                      >
                        <span>All packages</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                        No categories configured.
                      </div>
                      <Link
                        href="/packages"
                        prefetch={true}
                        role="menuitem"
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[var(--color-primary)] outline-none transition-colors hover:bg-[var(--color-muted)]"
                      >
                        <span>Browse all packages</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {NAV_ITEMS_SECONDARY.map(item => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={navLinkClasses(isActive(item.href))}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 md:hidden" />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-8 w-8 shrink-0 p-0 sm:w-auto sm:px-3"
              aria-label="Search packages"
              title="Search packages (⌘K)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--color-muted-foreground)] lg:inline">
                ⌘K
              </kbd>
            </Button>

            <ThemeToggle />

            {/* Cart */}
            <Button
              variant="outline"
              size="sm"
              onClick={openCart}
              className="relative"
              aria-label={`Cart (${effectiveItemCount} items)`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
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
                      Logout
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
                Login
              </Button>
            )}

            {/* Mobile-Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
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
          <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] md:hidden">
            <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
              {NAV_ITEMS_PRIMARY.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={navLinkClasses(isActive(item.href))}
                >
                  {item.label}
                </Link>
              ))}

              {hasCategories && (
                <div className="mt-2">
                  <div className="px-3 py-1.5 font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
                    Categories
                  </div>
                  {categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      prefetch={true}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-2 h-px bg-[var(--color-border)]" />

              {NAV_ITEMS_SECONDARY.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={navLinkClasses(isActive(item.href))}
                >
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => { setSearchOpen(true); setMobileOpen(false) }}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <Search className="h-4 w-4" />
                Search packages
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
                    Logout
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
                  Login
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
