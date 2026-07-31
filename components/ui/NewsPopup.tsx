'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Copy, Check } from 'lucide-react'
import { NEWS_POPUP } from '@/lib/config'
import { Button } from '@/components/ui/Button'
import { useHydrated } from '@/lib/useHydrated'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'news-popup-closed'

export function NewsPopup() {
  // Server-side there is no sessionStorage, so treat the popup as closed. The
  // `hydrated` guard keeps the first client render identical to the server
  // markup; the popup only appears on the render after hydration.
  const hydrated = useHydrated()
  const [closed, setClosed] = useState(
    () => typeof window === 'undefined' || !!sessionStorage.getItem(STORAGE_KEY),
  )
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  function copyCode() {
    if (!NEWS_POPUP.coupon) return
    navigator.clipboard.writeText(NEWS_POPUP.coupon)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function close() {
    setClosed(true)
    sessionStorage.setItem(STORAGE_KEY, '1')
  }

  if (!NEWS_POPUP.enabled || !hydrated || closed) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
      {/* Accent top border */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--color-primary)]/40 via-[var(--color-primary)] to-[var(--color-primary)]/40" />

      <div className="p-4">
        {/* Header */}
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-snug">{NEWS_POPUP.title}</p>
          <button
            onClick={close}
            className="mt-0.5 shrink-0 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Text */}
        <p className="mb-3.5 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
          {NEWS_POPUP.text}
        </p>

        {/* Coupon Code */}
        {NEWS_POPUP.coupon && (
          <div
            onClick={copyCode}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="mb-3.5 cursor-pointer select-none overflow-hidden rounded-lg border border-[var(--color-border)]"
            title="Click to copy"
          >
            <div className="flex items-center justify-between gap-2 bg-[var(--color-muted)] px-3 py-2">
              <span className="font-mono text-sm font-bold tracking-widest">
                {NEWS_POPUP.coupon}
              </span>
              {copied
                ? <Check className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />
                : <Copy className="h-3 w-3 shrink-0 text-[var(--color-muted-foreground)]" />
              }
            </div>
            <div
              className={cn(
                'flex items-center justify-center px-3 py-1.5 transition-colors duration-150',
                copied
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : hovered
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
              )}
            >
              <span className="text-[0.625rem] font-bold uppercase tracking-widest">
                {copied ? 'Copied!' : 'Click to Copy'}
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        {(NEWS_POPUP.button || NEWS_POPUP.secondButton) && (
          <div className="flex gap-2">
            {NEWS_POPUP.button && (
              <Button asChild size="sm" className="flex-1">
                <Link href={NEWS_POPUP.button.href} onClick={close}>
                  {NEWS_POPUP.button.label}
                </Link>
              </Button>
            )}
            {NEWS_POPUP.secondButton && (
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={NEWS_POPUP.secondButton.href} onClick={close}>
                  {NEWS_POPUP.secondButton.label}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
