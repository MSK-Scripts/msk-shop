'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { List, ShoppingCart, X } from '@/components/icons'
import { LanguageDropdown } from '@/components/i18n/LanguageDropdown'
import { useLang } from '@/components/i18n/LangProvider'
import { AccountMenu, type AccountState } from '@/components/layout/AccountMenu'
import { MainNav } from '@/components/layout/MainNav'
import { MOBILE_MENU_ID, MobileMenu } from '@/components/layout/MobileMenu'
import { useDismiss } from '@/components/layout/useDismiss'
import { layoutTranslations } from '@/lib/i18n'
import { useCart } from '@/lib/useCart'
import { useHydrated } from '@/lib/useHydrated'
import { useCartStore } from '@/store/cart'

/**
 * Finishes a sign-in that comes back from Tebex (`?success=true`) or from the
 * Discord link (`?discordLinked=true&discord_id=...`), and loads the basket.
 *
 * A component of its own inside its own `<Suspense>`: `useSearchParams` needs
 * that boundary, and around the whole header it kept the navigation out of
 * the server-rendered HTML whenever the boundary suspended.
 */
function SignInReturn() {
  const searchParams = useSearchParams()
  const { refreshBasket, processPendingPackage } = useCart()

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

  return null
}

function Brand() {
  return (
    <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5 text-[var(--color-foreground)]">
      <Image src="/logo.png" alt="" width={36} height={36} priority className="h-9 w-9 rounded-lg object-contain" />
      {/* Below 360 px the name gives way to cart and menu; it stays the
          link's name for a screen reader. */}
      <span className="sr-only font-display text-lead font-bold tracking-[-0.01em] [font-stretch:108%] min-[360px]:not-sr-only">
        MSK Scripts
      </span>
    </Link>
  )
}

const actionClass =
  'relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2 font-medium ' +
  'text-[var(--color-foreground)] transition-colors duration-150 hover:text-[var(--color-primary)]'

/**
 * The header (plan 5.3, sample page of Phase 0): MSK green stripe on top,
 * brand, the product lines, then language, cart and account. No search, the
 * catalogue is far below the 20 products where one pays off (E5).
 */
export function Header() {
  const { lang } = useLang()
  const t = layoutTranslations[lang]
  const pathname = usePathname()
  const { itemCount, loginAndAdd } = useCart()
  const { openCart, username, clearBasket } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // The stores hydrate from localStorage after mount. Until then server and
  // client render the defaults, or the markup would differ and React would
  // drop the event handlers of the whole subtree.
  const hydrated = useHydrated()
  const count = hydrated ? itemCount : 0

  // Menus close on every route change. Adjusted during render rather than in
  // an effect, so the open menu is never painted on the new page.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    setMenuOpen(false)
  }

  useDismiss(menuOpen, headerRef, reason => {
    setMenuOpen(false)
    if (reason === 'escape') menuButtonRef.current?.focus()
  })

  const account: AccountState = {
    username: hydrated ? username : null,
    signingIn,
    signIn: async () => {
      setSigningIn(true)
      try { await loginAndAdd() } finally { setSigningIn(false) }
    },
    signOut: () => clearBasket(),
  }

  const cartLabel = count > 0
    ? `${t.action_cart}, ${count === 1 ? t.cart_items_one : t.cart_items.replace('{count}', String(count))}`
    : t.action_cart

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-t-4 border-b-[var(--color-border)] border-t-[var(--color-brand)] bg-[var(--color-card)]"
    >
      <Suspense fallback={null}>
        <SignInReturn />
      </Suspense>

      <div className="container-page flex min-h-[var(--header-height)] items-center gap-[clamp(1rem,2vw,2.5rem)]">
        <Brand />

        <MainNav className="hidden xl:block" />

        <div className="ml-auto flex items-center gap-[clamp(0.25rem,0.9vw,1.25rem)]">
          <LanguageDropdown className="hidden sm:block" />

          <button type="button" onClick={openCart} aria-label={cartLabel} className={actionClass}>
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden min-[1440px]:inline">{t.action_cart}</span>
            {count > 0 && (
              <span className="rounded-full bg-[var(--color-primary)] px-[7px] text-[0.75em] font-bold leading-[1.5] text-[var(--color-primary-foreground)] tabular-nums">
                {count}
              </span>
            )}
          </button>

          <AccountMenu account={account} className="hidden md:block" />

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls={MOBILE_MENU_ID}
            className={`${actionClass} rounded-md border-[1.5px] border-[var(--color-input)] px-3 hover:border-[var(--color-foreground)] hover:text-[var(--color-foreground)] xl:hidden`}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            <span className="sr-only min-[480px]:not-sr-only">{t.menu}</span>
          </button>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        account={account}
        onNavigate={() => setMenuOpen(false)}
        className="xl:hidden"
      />
    </header>
  )
}
