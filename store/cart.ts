'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TebexBasket } from '@/types/tebex'

interface CartStore {
  ident: string | null
  basket: TebexBasket | null
  username: string | null
  subtotal: number | null
  // Local gift tracking — Tebex doesn't return gift_username in basket response
  giftRecipients: Record<number, { username: string; discordId?: string }>
  isOpen: boolean
  isLoading: boolean
  /** Paket, das gerade hinzugefuegt wird. `isLoading` bleibt global fuer
   *  Warenkorb-Aktionen; im Kartenraster wuerde ein globales Flag alle
   *  Karten gleichzeitig sperren. */
  pendingPackageId: number | null
  setIdent: (ident: string) => void
  setBasket: (basket: TebexBasket) => void
  clearBasket: () => void
  openCart: () => void
  closeCart: () => void
  setLoading: (loading: boolean) => void
  setPendingPackage: (packageId: number | null) => void
  setSubtotal: (s: number) => void
  setGiftRecipient: (packageId: number, username: string, discordId?: string) => void
  clearGiftRecipients: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      ident: null,
      basket: null,
      username: null,
      subtotal: null,
      giftRecipients: {},
      isOpen: false,
      isLoading: false,
      pendingPackageId: null,
      setIdent: (ident) => set({ ident }),
      setBasket: (basket) => set({ basket, username: basket.username ?? null }),
      clearBasket: () => {
        // Logout: the linked Discord ID belongs to the login state, drop it too
        if (typeof window !== 'undefined') localStorage.removeItem('discordId')
        set({ ident: null, basket: null, username: null, subtotal: null, giftRecipients: {} })
      },
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setPendingPackage: (pendingPackageId) => set({ pendingPackageId }),
      setSubtotal: (subtotal) => set({ subtotal }),
      setGiftRecipient: (packageId, username, discordId) => set(state => ({
        giftRecipients: { ...state.giftRecipients, [packageId]: { username, discordId } }
      })),
      clearGiftRecipients: () => set({ giftRecipients: {} }),
    }),
    {
      name: 'msk-cart',
      // Persist basket too so cart survives page reload
      partialize: (state) => ({
      ident: state.ident,
      username: state.username,
      basket: state.basket,
      subtotal: state.subtotal,
        giftRecipients: state.giftRecipients,
      }),
    }
  )
)
