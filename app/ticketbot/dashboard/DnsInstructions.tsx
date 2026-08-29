'use client'

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { dashboardTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'

type T = typeof dashboardTranslations['en'] | typeof dashboardTranslations['de']

/**
 * "Point an A record here, then let us check."
 *
 * Shared by both custom-domain flows — the transcripts one and the bot
 * dashboard one. The instructions are identical because the requirement is
 * identical, and this block is about eighty lines of markup: kept per card, the
 * two copies would drift, and the one that drifts is always the one nobody
 * looks at. The project already learned that from an error box copied into
 * eight admin tabs, only one of which had a role.
 */
export default function DnsInstructions({
  serverIp, copied, onCopyIp, onValidate, validating, t,
}: {
  serverIp:   string
  copied:     boolean
  onCopyIp:   () => void
  onValidate: () => void
  validating: boolean
  t:          T
}) {
  return (
    <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
      <p className="mb-3 text-sm font-semibold">{t.dns_title}</p>
      <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.dns_desc}</p>

      <div className="mb-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2">
          <div className="mb-1 text-[var(--color-muted-foreground)]">{t.dns_type}</div>
          <div className="font-mono font-semibold">A</div>
        </div>
        <div className="rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2">
          <div className="mb-1 text-[var(--color-muted-foreground)]">{t.dns_name}</div>
          <div className="font-mono font-semibold">@ or subdomain (www, transcript, etc.)</div>
        </div>
        <button
          type="button"
          onClick={onCopyIp}
          className="tap-target cursor-pointer rounded border border-[var(--color-border)] bg-[var(--color-card)] p-2 text-left transition-colors hover:border-[var(--color-primary)]/50"
        >
          <div className="mb-1 text-[var(--color-muted-foreground)]">{t.dns_target}</div>
          <div className="font-mono font-semibold text-[var(--color-primary)]">
            {copied ? `✓ ${t.dash_copied}` : serverIp}
          </div>
        </button>
      </div>

      <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">{t.dns_note}</p>
      <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-2.5 py-2 text-xs text-[var(--color-warning)]">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{t.dns_cloudflare}</span>
      </p>

      <Button onClick={onValidate} disabled={validating} variant="outline" className="w-full">
        {validating
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.dns_checking}</>
          : <><RefreshCw className="h-3.5 w-3.5" /> {t.dns_check}</>}
      </Button>
    </div>
  )
}
