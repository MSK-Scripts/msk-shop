'use client'

import { Flag } from '@/components/icons'

import { useLang } from '@/components/i18n/LangProvider'
import { layoutTranslations } from '@/lib/i18n'
import { absoluteUrl } from '@/lib/siteUrl'

// ── „Melden"-Link an nutzergenerierten Inhalten (Art. 16 DSA) ───────────────
//
// Die Verordnung verlangt ein Verfahren, das „leicht zugänglich und
// benutzerfreundlich" ist. Ein Formular, das nur im Fußzeilen-Menü steht und
// die URL von Hand abtippen lässt, ist beides nicht — deshalb sitzt der Link
// am Inhalt selbst und bringt die Adresse mit.
//
// The trigger is a button in a GET form, see below.
//
// The caller passes the internal path; it becomes the absolute public address
// here, because the report form should hold the address a third party sees in
// the browser, not an internal path.

export function ReportLink({ path, className }: { path: string; className?: string }) {
  const { lang, localize } = useLang()
  const label = layoutTranslations[lang].legal_report

  // A GET form instead of a link. Every image page carries it with its own
  // address, 8,478 in the crawl of 24.11.2026. As a link with `nofollow` each
  // of them was an internal nofollow outlink in the next crawl. A form is not
  // followed by crawlers, and for a visitor the button opens the same address
  // the link did.
  return (
    <form action={localize('/report')} method="get" className="inline">
      <input type="hidden" name="url" value={absoluteUrl(localize(path))} />
      <button
        type="submit"
        className={
          className
          ?? 'tap-target inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] '
             + 'transition-colors hover:text-[var(--color-foreground)]'
        }
      >
        <Flag className="h-3 w-3" aria-hidden="true" />
        {label}
      </button>
    </form>
  )
}
