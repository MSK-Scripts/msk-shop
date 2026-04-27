'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShoppingCart, ChevronDown, Menu, X, User, LogOut } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useCart } from '@/lib/useCart'
import { getCategories } from '@/lib/tebex'
import type { TebexCategory } from '@/types/tebex'
import Image from 'next/image'

function NavbarInner() {
  const [categories, setCategories] = useState<TebexCategory[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const { itemCount, loginAndAdd, refreshBasket, processPendingPackage } = useCart()
  const { openCart, username, clearBasket } = useCartStore()

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    const justLoggedIn = searchParams.get('success') === 'true'
    const discordLinked = searchParams.get('discordLinked') === 'true'
    const discordId = searchParams.get('discord_id')

    async function init() {
      await refreshBasket()

      if (justLoggedIn) {
        // FiveM auth complete — clean URL, then process pending package (may trigger Discord auth)
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
        await processPendingPackage()
      } else if (discordLinked && discordId) {
        // Discord auth complete — store discord_id, clean URL, add package
        console.log('[Navbar] Discord linked! discord_id:', discordId)
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function handleLogin() {
    setLoginLoading(true)
    try { await loginAndAdd() }
    finally { setLoginLoading(false) }
  }

  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">

        <Link href="/" className="flex items-center gap-2.5 mr-6 shrink-0">
          <Image 
                src="/logo.png" 
                alt="MSK Scripts Logo" 
                width={40} 
                height={40} 
                className="rounded" // Optional: Behält die leichten Rundungen bei
              />
          <span className="font-bold text-white text-[15px] hidden sm:block">MSK Scripts</span>
        </Link>

        <div className="hidden md:flex items-stretch h-14">
          <Link href="/" className="flex items-center px-4 text-sm text-muted hover:text-text transition-colors border-b-2 border-transparent hover:border-accent/40">
            Home
          </Link>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-4 h-full text-sm text-muted hover:text-text transition-colors border-b-2 border-transparent">
              Categories
              <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-surface2 border border-border rounded-xl shadow-2xl shadow-black/50 py-1.5 z-50">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/categories/${cat.id}`} onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted hover:text-text hover:bg-border/30 rounded-lg mx-1 transition-colors"
                    prefetch={true}>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          {username ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-surface2 border border-borderlt rounded-lg px-3 py-1.5">
                <User size={13} className="text-accent shrink-0" />
                <span className="text-xs text-white font-medium max-w-[120px] truncate">{username}</span>
              </div>
              <button onClick={() => clearBasket()} title="Logout"
                className="flex items-center bg-surface2 border border-borderlt rounded-lg px-2.5 py-1.5 text-muted hover:text-danger hover:border-danger/30 transition-all">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} disabled={loginLoading}
              className="hidden sm:inline-flex items-center gap-2 bg-accent hover:bg-accenthov disabled:opacity-60 text-white font-bold text-sm px-4 py-1.5 rounded-lg transition-colors">
              {loginLoading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <User size={14} />}
              Login
            </button>
          )}

          <button onClick={openCart}
            className="relative flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm text-muted hover:text-text hover:border-accent/30 transition-all">
            <ShoppingCart size={15} />
            <span className="hidden sm:block">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-muted hover:text-text transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm text-muted hover:text-text rounded-lg hover:bg-surface2 transition-colors">Home</Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.id}`} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted hover:text-text rounded-lg hover:bg-surface2 transition-colors" prefetch={true}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {cat.name}
            </Link>
          ))}
          {username ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-white"><User size={14} className="text-accent" /> {username}</div>
              <button onClick={() => { clearBasket(); setMobileOpen(false) }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-danger rounded-lg hover:bg-surface2 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <button onClick={() => { handleLogin(); setMobileOpen(false) }} className="flex items-center gap-2 px-3 py-2.5 text-sm text-accent font-semibold rounded-lg hover:bg-surface2 transition-colors">
              <User size={14} /> Login
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

export function Navbar() {
  return (
    <Suspense fallback={<nav className="sticky top-0 z-50 bg-surface border-b border-border h-14" />}>
      <NavbarInner />
    </Suspense>
  )
}
