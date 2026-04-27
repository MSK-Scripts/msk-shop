import Link from 'next/link'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'

export const metadata = { title: 'Imprint — MSK Scripts' }

export default function ImprintPage() {
  const html = renderMarkdown(getLegalContent('imprint'))
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-xs text-dim mb-8">
        <Link href="/" className="hover:text-muted transition-colors">Home</Link>
        <span>/</span>
        <span className="text-muted">Imprint</span>
      </nav>
      <div
        className="prose prose-invert prose-sm max-w-none text-muted leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
