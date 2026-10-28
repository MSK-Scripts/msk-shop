'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Check, Copy } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * A value to copy, an address or a redirect URI (plan 6.3, `CopyField`).
 *
 * The value stays selectable text, so it can always be copied by hand; the
 * button only saves the work. The browser refuses the clipboard outside a
 * secure context, and then the field says so instead of showing a tick that
 * lies.
 */
export function CopyField({ value, label, copy, className }: {
  value: string
  /** Visible name of the value; also names the button for a screen reader. */
  label?: string
  copy: { copy: string; copied: string; failed: string }
  className?: string
}) {
  const labelId = useId()
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('failed')
    }
  }

  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      {label && <span id={labelId} className="text-small font-semibold">{label}</span>}
      <div className="flex min-w-0 flex-wrap items-stretch gap-2">
        <code
          aria-labelledby={label ? labelId : undefined}
          className="flex min-h-11 min-w-0 flex-1 basis-56 items-center break-all rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 font-mono text-small"
        >
          {value}
        </code>
        <Button
          variant="outline"
          onClick={onCopy}
          aria-describedby={label ? labelId : undefined}
          className="shrink-0"
        >
          {state === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {state === 'copied' ? copy.copied : copy.copy}
        </Button>
      </div>
      <p role="status" className="text-small text-[var(--color-danger)] empty:hidden">
        {state === 'failed' ? copy.failed : ''}
      </p>
    </div>
  )
}
