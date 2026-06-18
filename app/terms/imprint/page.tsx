import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Imprint — MSK Scripts' }

export default function ImprintPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('imprint'))}
      htmlDe={renderMarkdown(getLegalContent('imprint-de'))}
      breadcrumb="Imprint"
      href="/terms/imprint"
    />
  )
}
