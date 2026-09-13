import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/**
 * Error box of the admin tabs.
 *
 * Until 22.08.2026 it existed eight times, byte-identical, in eight files, and
 * in none of them with `role="alert"`. Every one of these errors appears after
 * a request, i.e. exactly when nobody is looking at the spot where it
 * shows up.
 */
export function ErrorCard({ message }: { message: string }) {
  return (
    <Card role="alert" className="flex items-center gap-2 p-6 text-sm text-[var(--color-danger)]">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </Card>
  )
}
