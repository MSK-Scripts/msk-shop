'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2, Download, Gift, X, LogIn } from 'lucide-react'
import { useCart } from '@/lib/useCart'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { TebexPackage } from '@/types/tebex'

export function AddToCartButton({ pkg }: { pkg: TebexPackage }) {
  const { addPackage, giftPackage, isLoading, username } = useCart()
  const [hasDiscordId, setHasDiscordId] = useState(false)
  const [showDiscordModal, setShowDiscordModal] = useState(false)
  const [discordId, setDiscordId] = useState('')
  const [discordError, setDiscordError] = useState('')
  const [discordLoading, setDiscordLoading] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [giftUsername, setGiftUsername] = useState('')
  const [giftDiscordId, setGiftDiscordId] = useState('')
  const [giftError, setGiftError] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)

  const isFree = (pkg.base_price ?? 0) === 0
  const canGift = !pkg.disable_gifting && !isFree
  const needsLogin = !username

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('discordId') : null
    setHasDiscordId(!!stored)
  }, [username])

  function handleAddToCart() {
    if (needsLogin) {
      addPackage(pkg.id, pkg.type)
      return
    }
    if (hasDiscordId) {
      addPackage(pkg.id, pkg.type)
    } else {
      setDiscordId('')
      setDiscordError('')
      setShowDiscordModal(true)
    }
  }

  async function handleDiscordSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = discordId.trim()
    if (!id) { setDiscordError('Please enter your Discord ID.'); return }
    if (!/^\d{15,20}$/.test(id)) {
      setDiscordError('Discord ID must be 15-20 digits.')
      return
    }
    setDiscordLoading(true)
    setShowDiscordModal(false)
    await addPackage(pkg.id, pkg.type, { discord_id: id })
    setHasDiscordId(true)
    setDiscordLoading(false)
  }

  async function handleGiftSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!giftUsername.trim()) { setGiftError('Please enter a username.'); return }
    setGiftError('')
    setGiftLoading(true)
    const ok = await giftPackage(pkg.id, pkg.type, giftUsername.trim(), giftDiscordId.trim() || undefined)
    setGiftLoading(false)
    if (ok) { setShowGiftModal(false); setGiftUsername(''); setGiftDiscordId('') }
    else setGiftError('Could not add gift. Please check the username.')
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || discordLoading}
          size="lg"
          className="w-full"
        >
          {isLoading || discordLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : isFree ? <><Download className="h-4 w-4" />Download Free</>
            : needsLogin ? <><LogIn className="h-4 w-4" />Login to Purchase</>
            : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
        </Button>

        {needsLogin && !isFree && (
          <p className="text-center text-xs text-[var(--color-muted-foreground)]">
            Login with your CFX.re account to purchase
          </p>
        )}

        {canGift && !needsLogin && (
          <Button onClick={() => setShowGiftModal(true)} variant="outline" className="w-full">
            <Gift className="h-4 w-4" />
            Gift this
          </Button>
        )}
      </div>

      {/* Discord-ID Modal */}
      {showDiscordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDiscordModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <button
              onClick={() => setShowDiscordModal(false)}
              className="absolute right-4 top-4 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-[var(--color-discord)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.938 19.938 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.167 13.167 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              <h3 className="font-bold">Discord ID Required</h3>
            </div>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              Enter your Discord User ID to purchase{' '}
              <span className="font-semibold text-[var(--color-foreground)]">{pkg.name}</span>.
            </p>
            <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-xs text-[var(--color-muted-foreground)]">
              <p className="mb-1 font-semibold">How to find your Discord ID:</p>
              <ol className="flex list-decimal flex-col gap-1 pl-4">
                <li>Discord → Settings → Advanced → Enable <span className="text-[var(--color-foreground)]">Developer Mode</span></li>
                <li>Right-click your profile → <span className="text-[var(--color-foreground)]">Copy User ID</span></li>
              </ol>
            </div>
            <form onSubmit={handleDiscordSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-[var(--color-muted-foreground)]">Discord User ID</label>
                <Input
                  type="text"
                  value={discordId}
                  onChange={e => setDiscordId(e.target.value)}
                  placeholder="e.g. 123456789012345678"
                  className="font-mono"
                  autoFocus
                />
                {discordError && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{discordError}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !discordId.trim()} className="flex-1">
                  {isLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDiscordModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGiftModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <button
              onClick={() => setShowGiftModal(false)}
              className="absolute right-4 top-4 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-4 w-4 text-[var(--color-primary)]" />
              <h3 className="font-bold">Gift Package</h3>
            </div>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              Enter the FiveM/CFX username for{' '}
              <span className="font-semibold text-[var(--color-foreground)]">{pkg.name}</span>.
            </p>
            <form onSubmit={handleGiftSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-[var(--color-muted-foreground)]">
                  Recipient FiveM Username <span className="text-[var(--color-danger)]">*</span>
                </label>
                <Input
                  type="text"
                  value={giftUsername}
                  onChange={e => setGiftUsername(e.target.value)}
                  placeholder="Enter FiveM username..."
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[var(--color-muted-foreground)]">
                  Recipient Discord ID
                  <span className="ml-1 text-[var(--color-muted-foreground)]">(optional — for Discord roles)</span>
                </label>
                <Input
                  type="text"
                  value={giftDiscordId}
                  onChange={e => setGiftDiscordId(e.target.value)}
                  placeholder="e.g. 123456789012345678"
                  className="font-mono"
                />
                <p className="mt-1 text-[0.625rem] text-[var(--color-muted-foreground)]">
                  Discord → Settings → Advanced → Developer Mode → right-click profile → Copy User ID
                </p>
              </div>
              {giftError && <p className="text-xs text-[var(--color-danger)]">{giftError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={giftLoading || !giftUsername.trim()} className="flex-1">
                  {giftLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Gift className="h-4 w-4" />Add Gift to Cart</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowGiftModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
