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
  setIdent: (ident: string) => void
  setBasket: (basket: TebexBasket) => void
  clearBasket: () => void
  openCart: () => void
  closeCart: () => void
  setLoading: (loading: boolean) => void
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
      setIdent: (ident) => set({ ident }),
      setBasket: (basket) => set({ basket, username: basket.username ?? null }),
      clearBasket: () => set({ ident: null, basket: null, username: null, subtotal: null, giftRecipients: {} }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLoading: (isLoading) => set({ isLoading }),
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
