import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return { title: 'Imprint', alternates: alternatesFor(lang, '/terms/imprint') }
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
