import { cn } from '@/lib/utils'

/** Colored badge for a Tebex payment status (complete / refund / chargeback / …). */
export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const color =
    s === 'complete'
      ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
      : s === 'refund' || s === 'chargeback'
        ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
        : 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
  return (
    <span className={cn('inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', color)}>
      {status}
    </span>
  )
}
