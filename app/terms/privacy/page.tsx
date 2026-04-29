import { getLegalContent } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Privacy Policy — MSK Scripts' }

export default function PrivacyPage() {
  return (
    <LegalContent
      contentEn={getLegalContent('privacy')}
      contentDe={getLegalContent('privacy-de')}
      breadcrumb="Privacy Policy"
      href="/terms/privacy"
    />
  )
}
