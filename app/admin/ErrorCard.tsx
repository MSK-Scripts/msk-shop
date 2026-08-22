import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'

/**
 * Fehlerkasten der Admin-Tabs.
 *
 * Stand bis zum 22.08.2026 achtmal byteidentisch in acht Dateien, und in
 * keiner davon mit `role="alert"`. Jeder dieser Fehler erscheint nach einer
 * Anfrage, also genau dann, wenn niemand auf die Stelle schaut, an der er
 * auftaucht.
 */
export function ErrorCard({ message }: { message: string }) {
  return (
    <Card role="alert" className="flex items-center gap-2 p-6 text-sm text-[var(--color-danger)]">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {message}
    </Card>
  )
}
