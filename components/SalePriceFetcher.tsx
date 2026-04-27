'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { useSalePricesStore } from '@/store/salePrices'

// Fetches sale-adjusted package prices from Tebex using the basket ident.
// Tebex applies global and user-specific sales when a basket ident is provided.
// This runs once after login and keeps prices updated.
export function SalePriceFetcher() {
  const { ident } = useCartStore()
  const { setPrices } = useSalePricesStore()

  useEffect(() => {
    if (!ident) return

    async function fetchSalePrices() {
      try {
        const res = await fetch(`/api/packages?ident=${ident}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const packages: any[] = data.data ?? []

        const prices: Record<number, { base_price: number; total_price: number }> = {}
        for (const pkg of packages) {
          prices[pkg.id] = {
            base_price: pkg.base_price ?? 0,
            total_price: pkg.total_price ?? pkg.base_price ?? 0,
          }
        }
        setPrices(prices)
      } catch (e) {
        console.error('[SalePriceFetcher] error:', e)
      }
    }

    fetchSalePrices()
  }, [ident, setPrices])

  return null
}
