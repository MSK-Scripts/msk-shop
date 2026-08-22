import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/terms/imprint', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/terms/imprint'),
  }
}

export default function ImprintPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('imprint'))}
      htmlDe={renderMarkdown(getLegalContent('imprint-de'))}
      breadcrumbKey="legal_imprint"
      href="/terms/imprint"
    />
  )
}
