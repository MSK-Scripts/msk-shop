import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Terms & Conditions | MSK Scripts' }

export default function TermsPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('terms'))}
      htmlDe={renderMarkdown(getLegalContent('terms-de'))}
      breadcrumb="Terms & Conditions"
      href="/terms"
    />
  )
}
