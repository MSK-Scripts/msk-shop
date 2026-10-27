import type { Metadata } from 'next'
import { alternatesFor } from '@/lib/seo'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/legal/withdrawal', lang)
  return {
    title:       seo.absolute ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates:  alternatesFor(lang, '/legal/withdrawal'),
  }
}

export default function WithdrawalPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('widerruf'))}
      htmlDe={renderMarkdown(getLegalContent('widerruf-de'))}
      breadcrumbKey="legal_widerruf"
      href="/legal/withdrawal"
    />
  )
}
