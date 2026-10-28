'use client'

import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CaretRight as ChevronRight } from '@/components/icons'
import { useLang } from '@/components/i18n/LangProvider'
import { layoutTranslations } from '@/lib/i18n'
import { legalNotice, type LegalNoticeKind } from '@/lib/legalNotice'

interface Props {
  htmlEn: string
  htmlDe: string
  /** Schlüssel statt fertigem Text: der Breadcrumb stand sonst auf jeder der
   *  drei Seiten fest auf Englisch, während die Fußzeile daneben „AGB“ sagte. */
  breadcrumbKey: 'legal_terms' | 'legal_privacy' | 'legal_imprint' | 'legal_widerruf' | 'legal_avv'
  href: string
  /** Which language notice the page carries, see lib/legalNotice.ts. */
  notice: LegalNoticeKind
}

// Sprache kommt jetzt aus dem globalen Context (Umschalter in der Navbar);
// hier gibt es keinen eigenen Sprach-Switcher mehr.
export function LegalContent({ htmlEn, htmlDe, breadcrumbKey, href, notice }: Props) {
  const { lang, hrefFor } = useLang()
  const languageNotice = legalNotice(notice, lang)
  const other = lang === 'en' ? 'de' : 'en'
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

        {/* Language notice. A plain `<a>`, like the language switcher: the
            other version is another root segment, and a document request
            renders title and `<html lang>` anew. */}
        {languageNotice && lang === 'en' && (
          <aside
            lang="en"
            className="mb-8 max-w-[82rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-4 text-sm"
          >
            <p>
              {languageNotice.lead && <strong>{languageNotice.lead} </strong>}
              {languageNotice.text}{' '}
              <a href={hrefFor(other)} hrefLang={other} className="font-medium text-[var(--color-primary)] hover:underline">
                {languageNotice.link} →
              </a>
            </p>
          </aside>
        )}
        {languageNotice && lang === 'de' && (
          <p className="mb-6 text-xs">
            <a href={hrefFor(other)} hrefLang={other} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:underline">
              {languageNotice.link} →
            </a>
          </p>
        )}

        {/* Rendered Markdown */}
        <article
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
