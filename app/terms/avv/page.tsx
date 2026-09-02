import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/terms/avv', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/terms/avv'),
  }
}

export default function DpaPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('avv'))}
      htmlDe={renderMarkdown(getLegalContent('avv-de'))}
      breadcrumbKey="legal_avv"
      href="/terms/avv"
    />
  )
}
