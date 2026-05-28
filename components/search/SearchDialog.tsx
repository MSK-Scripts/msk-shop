'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Loader2, ArrowRight } from 'lucide-react'
import { getPackages } from '@/lib/tebex'
import type { TebexPackage } from '@/types/tebex'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Live-Search über alle Tebex-Packages.
 *
 * Lädt die Package-Liste beim ersten Öffnen (Caching im Component-State),
 * filtert client-seitig nach Name und navigiert beim Klick zu /packages/[id].
 */
export function SearchDialog({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [packages, setPackages] = useState<TebexPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Packages beim ersten Öffnen laden
  useEffect(() => {
    if (!open || packages.length > 0 || loading) return
    setLoading(true)
    setError(null)
    getPackages()
      .then(setPackages)
      .catch(err => {
        console.error('[SearchDialog]', err)
        setError('Could not load packages.')
      })
      .finally(() => setLoading(false))
  }, [open, packages.length, loading])

  // Focus + ESC + Body-Scroll-Lock
  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 30)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Query bei Close resetten
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  const q = query.trim().toLowerCase()
  const results = q
    ? packages.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8)
    : packages.slice(0, 8)

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
        role="dialog"
        aria-label="Search packages"
        aria-modal="true"
      >
        {/* Input-Zeile */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search packages…"
            className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)]"
            aria-label="Search query"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {error ? (
            <div className="py-8 text-center text-sm text-[var(--color-danger)]">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading packages…
            </div>
          ) : packages.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No packages available.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No matches for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map(pkg => {
                const basePrice = pkg.base_price ?? 0
                const totalPrice = pkg.total_price ?? basePrice
                const isFree = basePrice === 0
                return (
                  <li key={pkg.id}>
                    <Link
                      href={`/packages/${pkg.id}`}
                      prefetch={true}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-[var(--color-muted)]"
                    >
                      {pkg.image ? (
                        <Image
                          src={pkg.image}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--color-muted)]">
                          <Search className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{pkg.name}</div>
                        <div className="font-mono text-xs text-[var(--color-primary)]">
                          {isFree ? 'Free' : `€${totalPrice.toFixed(2)}`}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer-Hint */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-[0.625rem] text-[var(--color-muted-foreground)]">
          <span>
            <span className="font-mono">ESC</span> to close
          </span>
          <Link
            href="/packages"
            onClick={onClose}
            className="font-mono transition-colors hover:text-[var(--color-foreground)]"
          >
            View all packages →
          </Link>
        </div>
      </div>
    </div>
  )
}
