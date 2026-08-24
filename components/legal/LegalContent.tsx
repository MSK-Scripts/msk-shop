'use client'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ChevronRight } from 'lucide-react'
import { useLang } from '@/components/i18n/LangProvider'
import { layoutTranslations } from '@/lib/i18n'

interface Props {
  htmlEn: string
  htmlDe: string
  /** Schlüssel statt fertigem Text: der Breadcrumb stand sonst auf jeder der
   *  drei Seiten fest auf Englisch, während die Fußzeile daneben „AGB“ sagte. */
  breadcrumbKey: 'legal_terms' | 'legal_privacy' | 'legal_imprint'
  href: string
}

// Sprache kommt jetzt aus dem globalen Context (Umschalter in der Navbar);
// hier gibt es keinen eigenen Sprach-Switcher mehr.
export function LegalContent({ htmlEn, htmlDe, breadcrumbKey, href }: Props) {
  const { lang } = useLang()
  const html = lang === 'en' ? htmlEn : htmlDe
  // Stand als einziges Wort der Seite fest auf Englisch, auch unter lang="de".
  const home = layoutTranslations[lang].nav_home
  const breadcrumb = layoutTranslations[lang][breadcrumbKey]

  return (
    <div className="container-page py-10 md:py-14">
      {/* Kein eigener Deckel und kein `mx-auto`: der Lesedeckel sitzt an den
          Textelementen selbst (`.legal-content`, 82rem). Ein zentrierter
          768-px-Wrapper liess den Text bei 1920 px erst nach rund 576 px
          beginnen, waehrend Logo, Navigation und jede andere Seite an der
          Containerkante anfangen. */}
      <div>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
          <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">{home}</Link>
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
