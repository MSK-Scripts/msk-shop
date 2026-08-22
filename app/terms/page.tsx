import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Terms & Conditions', alternates: { canonical: '/terms' } }

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
