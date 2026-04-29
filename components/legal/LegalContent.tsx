'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'

interface Props {
  contentEn: string
  contentDe: string
  breadcrumb: string
  href: string
}

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

export function LegalContent({ contentEn, contentDe, breadcrumb, href }: Props) {
  const [lang, setLang] = useState<'en' | 'de'>('en')
  const [open, setOpen] = useState(false)

  const html = renderMarkdown(lang === 'en' ? contentEn : contentDe)
  const current = languages.find(l => l.code === lang)!

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Breadcrumb + language switcher */}
      <div className="flex items-center justify-between mb-8">
        <nav className="flex items-center gap-2 text-xs text-dim">
          <Link href="/" className="hover:text-muted transition-colors">Home</Link>
          <span>/</span>
          <Link href={href} className="text-muted hover:text-text transition-colors">{breadcrumb}</Link>
        </nav>

        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 bg-surface border border-borderlt hover:border-accent/40 rounded-lg px-3 py-1.5 text-xs text-muted hover:text-text transition-all"
          >
            <span>{current.flag}</span>
            <span className="font-medium">{current.label}</span>
            <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              {/* Click-outside backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-36 bg-surface2 border border-borderlt rounded-xl shadow-xl py-1 z-50">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code as 'en' | 'de'); setOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                      lang === l.code
                        ? 'text-accent bg-accent/10'
                        : 'text-muted hover:text-text hover:bg-border/20'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <span className="ml-auto text-accent">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rendered markdown */}
      <div
        className="text-muted leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
