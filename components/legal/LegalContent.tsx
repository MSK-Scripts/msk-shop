'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useLang } from '@/components/i18n/LangProvider'

interface Props {
  htmlEn: string
  htmlDe: string
  breadcrumb: string
  href: string
}

// Sprache kommt jetzt aus dem globalen Context (Umschalter in der Navbar);
// hier gibt es keinen eigenen Sprach-Switcher mehr.
export function LegalContent({ htmlEn, htmlDe, breadcrumb, href }: Props) {
  const { lang } = useLang()
  const html = lang === 'en' ? htmlEn : htmlDe

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={href} className="text-[var(--color-foreground)] transition-colors hover:underline">
            {breadcrumb}
          </Link>
        </nav>

        {/* Rendered Markdown */}
        <article
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
