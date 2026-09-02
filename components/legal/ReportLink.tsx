'use client'

import { Flag } from 'lucide-react'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
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
// Der Pfad kommt vom Aufrufer und wird hier zur absoluten Adresse gemacht:
// im Meldeformular soll die Adresse stehen, die ein Dritter im Browser sieht,
// nicht ein interner Pfad.

export function ReportLink({ path, className }: { path: string; className?: string }) {
  const { lang } = useLang()
  const label = layoutTranslations[lang].legal_report

  return (
    <Link
      href={`/report?url=${encodeURIComponent(absoluteUrl(path))}`}
      className={
        className
        ?? 'tap-target inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] '
           + 'transition-colors hover:text-[var(--color-foreground)]'
      }
    >
      <Flag className="h-3 w-3" aria-hidden="true" />
      {label}
    </Link>
  )
}
