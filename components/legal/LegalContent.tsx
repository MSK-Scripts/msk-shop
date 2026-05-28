'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import { setLangCookie } from '@/lib/lang'
import type { Lang } from '@/lib/i18n'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Props {
  htmlEn: string
  htmlDe: string
  breadcrumb: string
  href: string
  initialLang: Lang
}

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
] as const

export function LegalContent({ htmlEn, htmlDe, breadcrumb, href, initialLang }: Props) {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [open, setOpen] = useState(false)

  useEffect(() => { setLangCookie(lang) }, [lang])

  const html = lang === 'en' ? htmlEn : htmlDe
  const current = languages.find(l => l.code === lang)!

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb + Sprach-Switcher */}
        <div className="mb-8 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
            <Link href="/" className="transition-colors hover:text-[var(--color-foreground)]">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={href} className="text-[var(--color-foreground)] transition-colors hover:underline">
              {breadcrumb}
            </Link>
          </nav>

          {/* Language Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <span>{current.flag}</span>
              <span className="font-medium">{current.label}</span>
              <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
            </Button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl"
                >
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setOpen(false) }}
                      role="menuitem"
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-colors',
                        lang === l.code
                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <Check className="ml-auto h-3 w-3 text-[var(--color-primary)]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rendered Markdown */}
        <article
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
