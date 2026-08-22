import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Privacy Policy', alternates: { canonical: '/terms/privacy' } }

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
