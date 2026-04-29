import { getLegalContent } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Imprint — MSK Scripts' }

export default function ImprintPage() {
  return (
    <LegalContent
      contentEn={getLegalContent('imprint')}
      contentDe={getLegalContent('imprint-de')}
      breadcrumb="Imprint"
      href="/terms/imprint"
    />
  )
}
