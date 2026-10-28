'use client'

import { CircleNotch, FloppyDisk } from '@/components/icons'
import { Button } from '@/components/ui/Button'

/**
 * The bar with Save and Discard for a settings page (plan 6.3, Shopify).
 *
 * It appears only while there are unsaved changes, sticks to the bottom of
 * the window and stays above the tab bar of a phone. The message is a live
 * region, so a screen reader hears that the page now holds changes.
 */
export function SaveBar({ show, message, saveLabel, discardLabel, onSave, onDiscard, busy = false }: {
  show: boolean
  message: string
  saveLabel: string
  discardLabel: string
  onSave: () => void
  onDiscard: () => void
  busy?: boolean
}) {
  return (
    <div aria-live="polite" className="sticky bottom-[var(--app-tabbar)] z-20 lg:bottom-0">
      {show && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 shadow-[var(--shadow-card-hover)]">
          <p className="font-semibold">{message}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={onDiscard} disabled={busy}>{discardLabel}</Button>
            <Button onClick={onSave} disabled={busy} aria-busy={busy || undefined}>
              {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
              {saveLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
