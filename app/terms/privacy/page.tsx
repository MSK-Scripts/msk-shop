import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  return { title: 'Privacy Policy', alternates: alternatesFor(lang, '/terms/privacy') }
}

export default function PrivacyPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('privacy'))}
      htmlDe={renderMarkdown(getLegalContent('privacy-de'))}
      breadcrumbKey="legal_privacy"
      href="/terms/privacy"
    />
  )
}
