import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Privacy Policy | MSK Scripts' }

export default function PrivacyPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('privacy'))}
      htmlDe={renderMarkdown(getLegalContent('privacy-de'))}
      breadcrumb="Privacy Policy"
      href="/terms/privacy"
    />
  )
}
