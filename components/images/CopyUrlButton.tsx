'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { imagesTranslations, type Lang } from '@/lib/i18n'

/**
 * Die CDN-Adresse in die Zwischenablage legen.
 *
 * Das ist die Funktion, wegen der jemand die Galerie am Ende taeglich benutzt:
 * Bild suchen, URL kopieren, im Script einsetzen.
 *
 * `navigator.clipboard` lehnt in unsicherem Kontext ab, und ohne `catch` bliebe
 * eine unbehandelte Ablehnung stehen, waehrend der Haken trotzdem erschiene.
 * Dann haette der Nutzer eine leere Zwischenablage und eine Erfolgsmeldung.
 */
export function CopyUrlButton({
  url, lang, className, size = 'sm',
}: {
  url:        string
  lang:       Lang
  className?: string
  size?:      'sm' | 'md'
}) {
  const t = imagesTranslations[lang]
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('failed')
    }
  }

  const label = state === 'copied' ? t.copied : state === 'failed' ? t.copy_failed : t.copy_url

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={className}
        onClick={copy}
        aria-label={label}
      >
        {state === 'copied'
          ? <Check className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
          : <Copy  className="h-4 w-4" aria-hidden="true" />}
        <span>{state === 'copied' ? t.copied : t.copy_url}</span>
      </Button>

      {/* role="status", weil die Rueckmeldung nach einer Aktion erscheint und
          sonst nur farblich existiert. */}
      {state === 'failed' && (
        <p role="status" className="mt-2 text-xs text-[var(--color-danger)]">
          {t.copy_failed}
        </p>
      )}
    </div>
  )
}
