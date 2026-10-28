'use client'

import { useId, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { CircleNotch } from '@/components/icons'

/**
 * Asks before an action with serious consequences (plan 6.3, NN/g, Carbon).
 *
 * Only for those: asked too often, people click through. The buttons name the
 * consequence ("Remove domain", "Giveaway abbrechen") instead of Yes and No,
 * and the description says whether it can be undone. For what cannot, the
 * person types a name first (`typeToConfirm`); the field starts empty, never
 * with the value as a placeholder that looks filled in.
 */
export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel, cancelLabel,
  tone = 'danger', busy = false, typeToConfirm, notice, error,
}: {
  open: boolean
  onClose: () => void
  /**
   * Runs the action. Gets what was typed into the confirmation field, trimmed,
   * for an API that wants the typed value as its own confirmation.
   */
  onConfirm: (typed: string) => void
  title: ReactNode
  /** What happens, and whether it can be undone. */
  description: ReactNode
  /** Verb and object: "Remove domain". */
  confirmLabel: string
  cancelLabel: string
  tone?: 'danger' | 'primary'
  /** The action is running; the button shows it and both stay disabled. */
  busy?: boolean
  typeToConfirm?: { expected: string; label: ReactNode }
  /**
   * A consequence that needs more than the description's one sentence, a
   * warning about what stays behind for instance. Shown above the field.
   */
  notice?: ReactNode
  /** Why the action failed. The dialog stays open, so the person can retry or cancel. */
  error?: ReactNode
}) {
  const fieldId = useId()
  const [typed, setTyped] = useState('')
  const matches = !typeToConfirm || typed.trim() === typeToConfirm.expected

  function close() {
    setTyped('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      body={(typeToConfirm || notice || error) && (
        <div className="grid gap-3">
          {notice}
          {typeToConfirm && (
            <div className="grid gap-1.5">
              <label htmlFor={fieldId} className="text-small font-semibold">{typeToConfirm.label}</label>
              <Input
                id={fieldId}
                value={typed}
                onChange={e => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            </div>
          )}
          {error && (
            <p role="alert" className="text-small font-semibold text-[var(--color-danger)]">{error}</p>
          )}
        </div>
      )}
    >
      <Button variant="outline" onClick={close} disabled={busy}>{cancelLabel}</Button>
      <Button
        variant={tone === 'danger' ? 'danger' : 'primary'}
        onClick={() => onConfirm(typed.trim())}
        disabled={busy || !matches}
        aria-busy={busy || undefined}
      >
        {busy && <CircleNotch className="h-4 w-4 animate-spin" />}
        {confirmLabel}
      </Button>
    </Dialog>
  )
}
