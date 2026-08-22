import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return { title: 'Terms & Conditions', alternates: alternatesFor(lang, '/terms') }
}

export default function TermsPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('terms'))}
      htmlDe={renderMarkdown(getLegalContent('terms-de'))}
      breadcrumbKey="legal_terms"
      href="/terms"
    />
  )
}
