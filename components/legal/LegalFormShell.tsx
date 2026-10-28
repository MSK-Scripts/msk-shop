'use client'

import type { ReactNode } from 'react'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CheckCircle, WarningCircle } from '@/components/icons'
import { useLang } from '@/components/i18n/LangProvider'
import { PageHead } from '@/components/page/PageHead'
import { fieldClassName } from '@/components/ui/Input'
import { legalFormTranslations, packagesTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Frame of the three mandatory forms ──────────────────────────────────────
//
// Withdrawal, cancellation and the DSA report look alike apart from their
// fields: breadcrumb, heading, an explaining paragraph, the form, and the
// confirmation afterwards. Eighty lines of identical markup in three places
// drift apart, and the one that drifts is always the one nobody looks at,
// the lesson of the error box copied eight times across the admin tabs.

interface Props {
  breadcrumb: string
  title:      string
  intro:      string
  /** Visible as long as nothing has been sent. */
  children:   ReactNode
  /** Set once the declaration has arrived. It then replaces the form. */
  done?:      { title: string; text: string } | null
  /** Optional addition below the form, e.g. the pointer to the Stripe portal. */
  footnote?:  ReactNode
}

export function LegalFormShell({ breadcrumb, title, intro, children, done, footnote }: Props) {
  const { lang } = useLang()
  const t = legalFormTranslations[lang]

  return (
    <div className="container-page grid gap-[var(--space-stack)] pb-[var(--space-section)] pt-[clamp(1rem,0.5rem+1.5vw,3rem)]">
      <PageHead
        id="legal-form-title"
        crumbs={[{ label: packagesTranslations[lang].breadcrumb_home, href: '/' }, { label: breadcrumb }]}
        title={title}
        lead={done ? undefined : intro}
      />

      <div className="grid max-w-[44rem] gap-[var(--space-stack)]">
        {done ? (
          // `role="status"` rather than `alert`: the message replaces the form
          // and is therefore the main thing on the page anyway, it does not
          // need to interrupt. What matters is that a screen reader announces
          // it at all; it appears after a request, exactly when nobody is
          // looking at the right place.
          <div role="status" className="grid gap-3 rounded-lg border border-[var(--color-primary)] bg-[var(--color-accent-soft)] p-[clamp(1.125rem,1rem+0.5vw,1.75rem)]">
            <p className="flex items-start gap-2.5 font-display text-h3 font-[650]">
              <CheckCircle className="mt-[0.15em] h-6 w-6 shrink-0 text-[var(--color-success)]" />
              {done.title}
            </p>
            <p className="max-w-[40rem]">{done.text}</p>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-self-start font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-hover)] hover:underline"
            >
              {t.back_home}
            </Link>
          </div>
        ) : (
          <>
            {children}
            {footnote && (
              <div className="text-small text-[var(--color-muted-foreground)]">{footnote}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** The card a form sits in, with an optional heading of its own. */
export function FormCard({
  titleId, title, intro, children,
}: { titleId?: string; title?: string; intro?: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className="grid gap-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-[clamp(1.125rem,1rem+0.5vw,1.75rem)] shadow-[var(--shadow-card)]"
    >
      {(title || intro) && (
        <div className="grid gap-1.5">
          {title && <h2 id={titleId} className="font-display text-h3 font-[650]">{title}</h2>}
          {intro && <p className="text-[var(--color-muted-foreground)]">{intro}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

// ── Field building blocks ───────────────────────────────────────────────────

export function Field({
  id, label, hint, error, children,
}: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-small text-[var(--color-muted-foreground)]">{hint}</p>
      )}
      {error && (
        // The message is tied to the field through `aria-describedby` and
        // carries `role="alert"` as well, because it only appears after
        // submitting. Sign and word, not colour alone.
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-small font-semibold text-[var(--color-danger)]">
          <WarningCircle className="mt-[0.2em] h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/** The shared field look (3:1 border, 44 px, global focus ring). */
const INPUT_CLASS = fieldClassName

/** For a textarea: the same look, the height comes from `rows`. */
export const TEXTAREA_CLASS = cn(fieldClassName, 'min-h-28')

export { INPUT_CLASS }
