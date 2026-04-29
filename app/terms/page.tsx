import { getLegalContent } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Terms & Conditions — MSK Scripts' }

export default function TermsPage() {
  return (
    <LegalContent
      contentEn={getLegalContent('terms')}
      contentDe={getLegalContent('terms-de')}
      breadcrumb="Terms & Conditions"
      href="/terms"
    />
  )
}
