'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'

/**
 * Theme-Toggle — Light ↔ Dark.
 *
 * Nutzt `resolvedTheme`, das (anders als `theme`) nie `'system'` oder
 * `undefined` ist — immer entweder `'light'` oder `'dark'`. Damit zeigen
 * wir auch beim System-Default das passende Icon.
 *
 * Vor der Hydration rendert die Komponente einen Button ohne Icon (nur
 * Border), um Hydration-Mismatches zu vermeiden.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  const isDark = resolvedTheme === 'dark'

  function toggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 shrink-0 p-0"
        aria-label="Toggle theme"
      >
        {/* Platzhalter — selbe Größe, kein Icon → kein Hydration-Mismatch */}
        <span className="block h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 shrink-0 p-0"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  )
}
