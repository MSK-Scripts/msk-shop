'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Copy, Check } from 'lucide-react'
import { NEWS_POPUP } from '@/lib/config'

export function NewsPopup() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  function copyCode() {
    if (!NEWS_POPUP.coupon) return
    navigator.clipboard.writeText(NEWS_POPUP.coupon)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Show on every full page load (not on client-side navigation)
  // We use a sessionStorage flag that's set per-navigation to distinguish
  useEffect(() => {
    if (!NEWS_POPUP.enabled) return
    // Use a timestamp so it resets on each hard load but not on tab switches
    const key = 'news-popup-closed'
    const closed = sessionStorage.getItem(key)
    if (!closed) setVisible(true)
  }, [])

  function close() {
    setVisible(false)
    sessionStorage.setItem('news-popup-closed', '1')
  }

  if (!visible || !NEWS_POPUP.enabled) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-surface border border-borderlt rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in">
      {/* Accent top border */}
      <div className="h-0.5 w-full bg-gradient-to-r from-accent/60 via-accent to-accent/60" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <p className="text-white font-bold text-sm leading-snug">{NEWS_POPUP.title}</p>
          <button
            onClick={close}
            className="text-dim hover:text-text transition-colors shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Text */}
        <p className="text-muted text-xs leading-relaxed mb-3.5">
          {NEWS_POPUP.text}
        </p>

        {/* Coupon Code */}
        {NEWS_POPUP.coupon && (
          <div
            onClick={copyCode}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="mb-3.5 rounded-lg overflow-hidden border border-borderlt cursor-pointer select-none"
            title="Click to copy"
          >
            {/* Code row */}
            <div className="bg-surface2 px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-white font-bold text-sm tracking-widest font-mono">
                {NEWS_POPUP.coupon}
              </span>
              {copied
                ? <Check size={13} className="text-accent shrink-0" />
                : <Copy size={13} className="text-dim shrink-0" />
              }
            </div>
            {/* Copy button row */}
            <div
              className="px-3 py-1.5 flex items-center justify-center transition-colors duration-150"
              style={{ backgroundColor: copied ? '#4e9827' : hovered ? '#5eb131' : '#3a3b3e' }}
            >
              <span
                className="text-[10px] font-bold tracking-widest uppercase transition-colors duration-150"
                style={{ color: copied || hovered ? '#ffffff' : '#8d9096' }}
              >
                {copied ? 'Copied!' : 'Click to Copy'}
              </span>
            </div>
          </div>
        )}

        {/* Buttons */}
        {(NEWS_POPUP.button || NEWS_POPUP.secondButton) && (
          <div className="flex gap-2">
            {NEWS_POPUP.button && (
              <Link
                href={NEWS_POPUP.button.href}
                onClick={close}
                className="msk-btn-primary flex-1 justify-center text-xs py-2"
              >
                {NEWS_POPUP.button.label}
              </Link>
            )}
            {NEWS_POPUP.secondButton && (
              <Link
                href={NEWS_POPUP.secondButton.href}
                onClick={close}
                className="msk-btn-ghost flex-1 justify-center text-xs py-2"
              >
                {NEWS_POPUP.secondButton.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
