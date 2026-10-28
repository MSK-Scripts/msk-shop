'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useLang } from '@/components/i18n/LangProvider'
import { adminCopy } from '@/lib/i18n'
import { AdminShell } from './AdminShell'

// Error boundary for the /admin segment. Keeps a client-side exception contained
// (with a clean, CSP-compliant fallback) instead of taking down the whole app.
// Inside the shell's sign-in frame: the boundary replaces the page, and with it
// the shell the page would have drawn.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  const { lang } = useLang()
  const c = adminCopy(lang)
  return (
    <AdminShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card role="alert" className="w-full max-w-md p-8 text-center">
          <h1 className="font-display text-h3 font-bold tracking-tight">{c.error_title}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {c.error_body}
          </p>
          <Button className="mt-5" onClick={reset}>{c.error_retry}</Button>
        </Card>
      </div>
    </AdminShell>
  )
}
