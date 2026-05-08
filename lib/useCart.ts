'use client'

import { useCallback } from 'react'
import { useCartStore } from '@/store/cart'
import {
  createBasket, getBasket, addToBasket, addGiftToBasket,
  removeFromBasket, applyCoupon, removeCoupon, getAllAuthUrls,
} from '@/lib/tebex'

export function useCart() {
  const { ident, basket, username, isLoading, setIdent, setBasket, setLoading, openCart, setSubtotal } = useCartStore()
  const { subtotal, giftRecipients, setGiftRecipient } = useCartStore()

  const getBaseUrl = () => typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.msk-scripts.de'

  const ensureBasket = useCallback(async (): Promise<string> => {
    if (ident) {
      try { const b = await getBasket(ident); setBasket(b); return ident } catch {}
    }
    const b = await createBasket()
    setIdent(b.ident); setBasket(b); return b.ident
  }, [ident, setIdent, setBasket])

  const triggerDiscordAuth = useCallback((returnPath: string) => {
    if (typeof window === 'undefined') return
    const baseUrl = getBaseUrl()
    sessionStorage.setItem('discordReturnPath', returnPath)
    const callbackUrl = `${baseUrl}/auth/discord`
    window.location.href = `https://ident.tebex.io/discord/?return=${encodeURIComponent(callbackUrl)}`
  }, [])

  const loginAndAdd = useCallback(async (packageId?: number, packageType?: string) => {
    try {
      const id = await ensureBasket()
      if (typeof window !== 'undefined') {
        if (packageId) {
          sessionStorage.setItem('pendingPackageId', String(packageId))
          sessionStorage.setItem('pendingPackageType', packageType ?? 'single')
        }
        sessionStorage.setItem('pendingBasketIdent', id)
        sessionStorage.removeItem('discordId')
        sessionStorage.setItem('wantDiscordAuth', '1')
      }
      const authUrls = await getAllAuthUrls(id, window.location.href)
      const fivemUrl = authUrls.find(a => a.name === 'FiveM') ?? authUrls[0]
      if (fivemUrl?.url) window.location.href = fivemUrl.url
    } catch (e) { console.error('Login error:', e) }
  }, [ensureBasket])

  const processPendingPackage = useCallback(async () => {
    if (typeof window === 'undefined') return
    const pendingId = sessionStorage.getItem('pendingPackageId')
    const pendingType = sessionStorage.getItem('pendingPackageType') ?? 'single'
    const pendingIdent = sessionStorage.getItem('pendingBasketIdent')
    const discordId = sessionStorage.getItem('discordId')
    const wantDiscord = sessionStorage.getItem('wantDiscordAuth')

    if (!pendingIdent && !wantDiscord) return

    try {
      const authBasket = await getBasket(pendingIdent!)
      if (!authBasket.username) return

      setBasket(authBasket)
      if (pendingIdent) setIdent(pendingIdent)

      if (!discordId) {
        if (wantDiscord || pendingId) {
          triggerDiscordAuth(window.location.pathname)
        }
        return
      }

      // Both auths done
      sessionStorage.removeItem('wantDiscordAuth')

      if (!pendingId) {
        // Plain login — discord_id stored for later use
        return
      }

      // Add pending package
      sessionStorage.removeItem('pendingPackageId')
      sessionStorage.removeItem('pendingPackageType')
      sessionStorage.removeItem('pendingBasketIdent')
      sessionStorage.removeItem('discordId')
      sessionStorage.removeItem('discordReturnPath')

      const usernameId = authBasket.username_id ? String(authBasket.username_id) : null
      setLoading(true)
      const b = await addToBasket(pendingIdent!, Number(pendingId), pendingType, 1, usernameId, { discord_id: discordId })
      setBasket(b)
      // No coupon at this point, so set subtotal
      setSubtotal(b.total_price)
      openCart()
    } catch (e) {
      console.error('[processPending] Error:', e)
    } finally {
      setLoading(false)
    }
  }, [setBasket, setIdent, setLoading, openCart, triggerDiscordAuth, setSubtotal])

  const addPackage = useCallback(async (packageId: number, packageType: string = 'single', variableData?: Record<string, string>) => {
    if (!username) {
      await loginAndAdd(packageId, packageType)
      return
    }
    setLoading(true)
    try {
      const id = await ensureBasket()
      const currentBasket = await getBasket(id)
      const usernameId = currentBasket.username_id ? String(currentBasket.username_id) : null
      const storedDiscordId = typeof window !== 'undefined' ? sessionStorage.getItem('discordId') : null
      const mergedVarData = {
        ...(storedDiscordId ? { discord_id: storedDiscordId } : {}),
        ...(variableData ?? {}),
      }
      const finalVarData = Object.keys(mergedVarData).length > 0 ? mergedVarData : undefined
      const b = await addToBasket(id, packageId, packageType, 1, usernameId, finalVarData)
      setBasket(b)
      // Update subtotal only if no coupon active
      if (!b.coupons?.length) setSubtotal(b.total_price)
      openCart()
    } catch (e) { console.error('Add to cart error:', e) }
    finally { setLoading(false) }
  }, [username, loginAndAdd, ensureBasket, setBasket, setLoading, openCart, setSubtotal])

  const giftPackage = useCallback(async (packageId: number, packageType: string = 'single', giftUsername: string, recipientDiscordId?: string): Promise<boolean> => {
    if (!username) { await loginAndAdd(packageId, packageType); return false }
    setLoading(true)
    try {
      const id = await ensureBasket()
      const currentBasket = await getBasket(id)
      const usernameId = currentBasket.username_id ? String(currentBasket.username_id) : null
      const storedDiscordId = typeof window !== 'undefined' ? sessionStorage.getItem('discordId') : null
      const b = await addGiftToBasket(id, packageId, packageType, giftUsername, usernameId, storedDiscordId, recipientDiscordId)
      setGiftRecipient(packageId, giftUsername, recipientDiscordId)
      setBasket(b); openCart(); return true
    } catch (e) { console.error('Gift error:', e); return false }
    finally { setLoading(false) }
  }, [username, loginAndAdd, ensureBasket, setBasket, setLoading, openCart, setGiftRecipient])

  const removePackage = useCallback(async (packageId: number) => {
    if (!ident) return
    setLoading(true)
    try {
      const b = await removeFromBasket(ident, packageId)
      setBasket(b)
      // Reset subtotal if basket is now empty or no coupons
      if (!b.packages?.length || !b.coupons?.length) setSubtotal(b.total_price)
    } catch (e) { console.error('Remove error:', e) }
    finally { setLoading(false) }
  }, [ident, setBasket, setLoading, setSubtotal])

  const applyCode = useCallback(async (code: string): Promise<true | 'not_applicable' | false> => {
    if (!ident) return false
    setLoading(true)
    try {
      // Capture pre-coupon total before applying
      const preCouponBasket = await getBasket(ident)
      setSubtotal(preCouponBasket.total_price)
      await applyCoupon(ident, code)
      const b = await getBasket(ident)
      setBasket(b)
      return true
    } catch (e: unknown) {
      // Tebex 400 = coupon not applicable to basket items
      if (e instanceof Error && e.message.includes('400')) return 'not_applicable'
      return false
    } finally { setLoading(false) }
  }, [ident, setBasket, setLoading, setSubtotal])

  const removeCode = useCallback(async (code: string) => {
    if (!ident) return
    setLoading(true)
    try {
      // Try API removal first
      const res = await removeCoupon(ident, code)
      const b = await getBasket(ident)
      setBasket(b)
      setSubtotal(b.total_price)
    } catch {
      // Tebex Headless API may not support coupon removal.
      // Workaround: create a new basket and re-add all packages.
      if (!basket?.packages?.length) { setLoading(false); return }
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : getBaseUrl()
        const newBasket = await createBasket()
        // Re-add all packages to new basket
        const storedDiscordId = typeof window !== 'undefined' ? sessionStorage.getItem('discordId') : null
        const currentBasket = await getBasket(ident)
        const usernameId = currentBasket.username_id ? String(currentBasket.username_id) : null
        let lastBasket = newBasket
        for (const pkg of basket.packages) {
          const varData: Record<string, string> = {}
          if (storedDiscordId) varData.discord_id = storedDiscordId
          const b = await addToBasket(
            newBasket.ident, pkg.id, 'single', pkg.in_basket?.quantity ?? 1,
            usernameId, Object.keys(varData).length ? varData : undefined
          )
          lastBasket = b
        }
        setIdent(newBasket.ident)
        setBasket(lastBasket)
        setSubtotal(lastBasket.total_price)
      } catch (innerErr) { console.error('Remove coupon fallback error:', innerErr) }
    } finally { setLoading(false) }
  }, [ident, basket, setBasket, setIdent, setLoading, setSubtotal])

  const refreshBasket = useCallback(async () => {
    if (!ident) return
    try { const b = await getBasket(ident); setBasket(b) } catch {}
  }, [ident, setBasket])

  const links = basket?.links
  const checkoutUrl = !Array.isArray(links) && links ? (links as { checkout?: string }).checkout ?? null : null

  return {
    basket, ident, username, isLoading,
    itemCount: basket?.packages?.length ?? 0,
    subtotal,
    giftRecipients,
    total: basket?.total_price ?? 0,
    currency: basket?.currency ?? 'EUR',
    checkoutUrl,
    addPackage, giftPackage, removePackage,
    applyCode, removeCode, refreshBasket,
    ensureBasket, loginAndAdd, processPendingPackage, triggerDiscordAuth,
  }
}
