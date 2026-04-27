'use client'

import { create } from 'zustand'

// Stores sale prices fetched from Tebex with basket context
// Key: package ID, Value: { base_price, total_price }
interface SalePricesStore {
  prices: Record<number, { base_price: number; total_price: number }>
  setPrices: (prices: Record<number, { base_price: number; total_price: number }>) => void
  clear: () => void
}

export const useSalePricesStore = create<SalePricesStore>((set) => ({
  prices: {},
  setPrices: (prices) => set({ prices }),
  clear: () => set({ prices: {} }),
}))
