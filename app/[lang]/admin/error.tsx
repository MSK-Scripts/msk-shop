'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Error boundary for the /admin segment. Keeps a client-side exception contained
// (with a clean, CSP-compliant fallback) instead of taking down the whole app.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-lg font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          An error occurred in the admin dashboard.
        </p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </Card>
    </div>
  )
}
