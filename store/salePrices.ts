'use client'

import { create } from 'zustand'
import type { SaleData } from '@/lib/price'

// Stores sale prices fetched from Tebex with basket context
// Key: package ID, Value: { base_price, total_price, discount }
interface SalePricesStore {
  prices: Record<number, SaleData>
  setPrices: (prices: Record<number, SaleData>) => void
  clear: () => void
}

export const useSalePricesStore = create<SalePricesStore>((set) => ({
  prices: {},
  setPrices: (prices) => set({ prices }),
  clear: () => set({ prices: {} }),
}))
