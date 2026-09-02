'use client'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useLang } from '@/components/i18n/LangProvider'
import { layoutTranslations, legalFormTranslations } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/Card'

// ── Rahmen der drei Pflichtformulare ────────────────────────────────────────
//
// Widerruf, Kündigung und DSA-Meldung sehen bis auf ihre Felder gleich aus:
// Breadcrumb, Überschrift, ein erklärender Absatz, das Formular und danach die
// Erfolgsmeldung. Achtzig Zeilen identisches Markup an drei Stellen driften
// auseinander, und die driftende ist immer die, auf die niemand schaut — die
// Lehre aus dem achtfach kopierten Fehlerkasten der Admin-Tabs.

interface Props {
  breadcrumb: string
  title:      string
  intro:      string
  /** Sichtbar, solange nichts abgeschickt wurde. */
  children:   React.ReactNode
  /** Gesetzt, sobald die Erklärung angekommen ist. Dann ersetzt sie das Formular. */
  done?:      { title: string; text: string } | null
  /** Optionaler Zusatz unter dem Formular, z. B. der Verweis auf das Stripe-Portal. */
  footnote?:  React.ReactNode
}

export function LegalFormShell({ breadcrumb, title, intro, children, done, footnote }: Props) {
  const { lang } = useLang()
  const home = layoutTranslations[lang].nav_home
  const t    = legalFormTranslations[lang]

  return (
    <div className="container-page py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
        <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">{home}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[var(--color-foreground)]">{breadcrumb}</span>
      </nav>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-[var(--color-foreground)]">{title}</h1>

        {done ? (
          // `role="status"` statt `alert`: die Meldung ersetzt das Formular und
          // ist damit ohnehin die Hauptsache der Seite, sie muss nicht
          // unterbrechen. Wichtig ist nur, dass ein Screenreader sie überhaupt
          // ankündigt — sie erscheint nach einer Anfrage, also genau dann, wenn
          // niemand auf die richtige Stelle schaut.
          <div role="status" className="mt-6 rounded-lg border border-[var(--color-primary)]/30 bg-[color-mix(in_oklab,var(--color-primary)_8%,transparent)] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[var(--color-foreground)]">{done.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{done.text}</p>
              </div>
            </div>
            <Link
              href="/"
              className="tap-target mt-4 inline-flex text-sm text-[var(--color-primary)] hover:underline"
            >
              {t.back_home}
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{intro}</p>
            <Card className="mt-6">
              {/* `p-6` statt der Vorgabe `p-6 pt-0`: die Karte trägt hier
                  keinen CardHeader, ohne oberes Polster klebt das erste Feld
                  am Rand. */}
              <CardContent className="p-6">{children}</CardContent>
            </Card>
            {footnote && (
              <div className="mt-4 text-xs leading-relaxed text-[var(--color-muted-foreground)]">{footnote}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Feld-Bausteine ──────────────────────────────────────────────────────────

export function Field({
  id, label, hint, error, children,
}: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {error && (
        // Die Fehlermeldung hängt über `aria-describedby` am Feld und trägt
        // zusätzlich `role="alert"`, weil sie erst nach dem Absenden erscheint.
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm '
  + 'text-[var(--color-foreground)] outline-none transition-colors '
  + 'focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'

export { INPUT_CLASS }
