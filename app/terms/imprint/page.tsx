import { getLegalContent, renderMarkdown } from '@/lib/markdown'
import { LegalContent } from '@/components/legal/LegalContent'

export const metadata = { title: 'Imprint', alternates: { canonical: '/terms/imprint' } }

export default function ImprintPage() {
  return (
    <LegalContent
      htmlEn={renderMarkdown(getLegalContent('imprint'))}
      htmlDe={renderMarkdown(getLegalContent('imprint-de'))}
      breadcrumbKey="legal_imprint"
      href="/terms/imprint"
    />
  )
}
