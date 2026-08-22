import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/terms/privacy', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/terms/privacy'),
  }
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
