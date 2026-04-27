'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2, Download, Gift, X, LogIn } from 'lucide-react'
import { useCart } from '@/lib/useCart'
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

  // Check sessionStorage for stored discord_id on mount and when username changes
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
      // discord_id already available — add directly
      addPackage(pkg.id, pkg.type)
    } else {
      // No discord_id — show Discord input modal
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
    // Update local state so subsequent adds don't need modal again
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
        <button
          onClick={handleAddToCart}
          disabled={isLoading || discordLoading}
          className="msk-btn-primary w-full justify-center py-3 text-sm"
        >
          {isLoading || discordLoading
            ? <Loader2 size={16} className="animate-spin" />
            : isFree ? <><Download size={16} />Download Free</>
            : needsLogin ? <><LogIn size={16} />Login to Purchase</>
            : <><ShoppingCart size={16} />Add to Cart</>}
        </button>

        {needsLogin && !isFree && (
          <p className="text-center text-xs text-dim">Login with your CFX.re account to purchase</p>
        )}

        {canGift && !needsLogin && (
          <button onClick={() => setShowGiftModal(true)} className="msk-btn-ghost w-full justify-center py-2.5 text-sm">
            <Gift size={14} />Gift this
          </button>
        )}
      </div>

      {/* Discord ID Modal */}
      {showDiscordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDiscordModal(false)} />
          <div className="relative bg-surface border border-borderlt rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <button onClick={() => setShowDiscordModal(false)} className="absolute top-4 right-4 text-muted hover:text-text"><X size={18} /></button>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.938 19.938 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.167 13.167 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              <h3 className="text-white font-bold">Discord ID Required</h3>
            </div>
            <p className="text-muted text-sm mb-4">
              Enter your Discord User ID to purchase{' '}
              <span className="text-white font-semibold">{pkg.name}</span>.
            </p>
            <div className="bg-surface2 border border-borderlt rounded-lg p-3 mb-4 text-xs text-dim">
              <p className="font-semibold text-muted mb-1">How to find your Discord ID:</p>
              <ol className="flex flex-col gap-1 pl-4 list-decimal">
                <li>Discord → Settings → Advanced → Enable <span className="text-text">Developer Mode</span></li>
                <li>Right-click your profile → <span className="text-text">Copy User ID</span></li>
              </ol>
            </div>
            <form onSubmit={handleDiscordSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-dim mb-1.5 block">Discord User ID</label>
                <input type="text" value={discordId} onChange={e => setDiscordId(e.target.value)}
                  placeholder="e.g. 123456789012345678" className="msk-input font-mono" autoFocus />
                {discordError && <p className="text-danger text-xs mt-1.5">{discordError}</p>}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isLoading || !discordId.trim()}
                  className="msk-btn-primary flex-1 justify-center py-2.5 text-sm">
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <><ShoppingCart size={14} />Add to Cart</>}
                </button>
                <button type="button" onClick={() => setShowDiscordModal(false)} className="msk-btn-ghost px-4 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowGiftModal(false)} />
          <div className="relative bg-surface border border-borderlt rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <button onClick={() => setShowGiftModal(false)} className="absolute top-4 right-4 text-muted hover:text-text"><X size={18} /></button>
            <div className="flex items-center gap-2 mb-4"><Gift size={18} className="text-accent" /><h3 className="text-white font-bold">Gift Package</h3></div>
            <p className="text-muted text-sm mb-4">Enter the FiveM/CFX username for <span className="text-white font-semibold">{pkg.name}</span>.</p>
            <form onSubmit={handleGiftSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-dim mb-1.5 block">Recipient FiveM Username <span className="text-danger">*</span></label>
                <input type="text" value={giftUsername} onChange={e => setGiftUsername(e.target.value)} placeholder="Enter FiveM username..." className="msk-input" autoFocus />
              </div>
              <div>
                <label className="text-xs text-dim mb-1.5 block">
                  Recipient Discord ID
                  <span className="text-dim ml-1">(optional — for Discord roles)</span>
                </label>
                <input type="text" value={giftDiscordId} onChange={e => setGiftDiscordId(e.target.value)}
                  placeholder="e.g. 123456789012345678" className="msk-input font-mono" />
                <p className="text-[10px] text-dim mt-1">Discord → Settings → Advanced → Developer Mode → right-click profile → Copy User ID</p>
              </div>
              {giftError && <p className="text-danger text-xs">{giftError}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={giftLoading || !giftUsername.trim()} className="msk-btn-primary flex-1 justify-center py-2.5 text-sm">
                  {giftLoading ? <Loader2 size={14} className="animate-spin" /> : <><Gift size={14} />Add Gift to Cart</>}
                </button>
                <button type="button" onClick={() => setShowGiftModal(false)} className="msk-btn-ghost px-4 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
