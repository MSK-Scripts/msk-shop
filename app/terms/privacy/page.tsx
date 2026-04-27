import Link from 'next/link'
import { getLegalContent, renderMarkdown } from '@/lib/markdown'

export const metadata = { title: 'Privacy Policy — MSK Scripts' }

export default function PrivacyPage() {
  const html = renderMarkdown(getLegalContent('privacy'))
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="flex items-center gap-2 text-xs text-dim mb-8">
        <Link href="/" className="hover:text-muted transition-colors">Home</Link>
        <span>/</span>
        <span className="text-muted">Privacy Policy</span>
      </nav>
      <div
        className="prose prose-invert prose-sm max-w-none text-muted leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
