'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github, Receipt, ShieldCheck, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLang } from '@/components/i18n/LangProvider'
import { PaymentMarks } from '@/components/layout/PaymentMarks'
import { layoutTranslations } from '@/lib/i18n'

const ECOSYSTEM_LINKS = [
  { label: 'MSK Forms',      href: 'https://forms.msk-scripts.de/',     external: true },
  { label: 'MSK Paste',      href: 'https://paste.msk-scripts.de/',     external: true },
  { label: 'MSK Shortener',  href: 'https://s.msk-scripts.de/',         external: true },
] as const

const DISCORD_URL = 'https://discord.gg/5hHSBRHvJE'
const GITHUB_URL = 'https://github.com/MSK-Scripts'
// Dieselbe Adresse, die § 4 der AGB als Kontakt für Rückerstattungen nennt.
const SUPPORT_EMAIL = 'info@msk-scripts.de'

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  const cls = 'block py-1 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]'
  // Externe Links (http/https) werden automatisch erkannt und öffnen in einem
  // neuen Tab; `external` kann das Verhalten zusätzlich erzwingen.
  const isExternal = external ?? /^https?:\/\//i.test(href)
  if (isExternal) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
  }
  return <Link href={href} className={cls}>{children}</Link>
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
      {children}
    </div>
  )
}

export function Footer() {
  const { lang } = useLang()
  const t = layoutTranslations[lang]

  const shopLinks = [
    { label: t.footer_all_packages, href: '/packages' },
    { label: t.footer_resource_stats, href: '/resources' },
  ]
  // Support-Spalte: die Kanäle, über die Kunden vor und nach dem Kauf Hilfe
  // bekommen. Die E-Mail ist dieselbe, die § 4 der AGB für Rückerstattungen
  // nennt. Bewusst KEIN „Status"-Link, es gibt keine Statusseite.
  const supportLinks = [
    { label: t.footer_discord,       href: DISCORD_URL,                  external: true },
    { label: t.footer_documentation, href: 'https://docu.msk-scripts.de/', external: true },
    { label: 'GitHub',               href: GITHUB_URL,                   external: true },
  ]
  // Legal-Labels sind sprachabhängig (z. B. Imprint ⇄ Impressum).
  const legalLinks = [
    { label: t.legal_imprint, href: '/terms/imprint' },
    { label: t.legal_privacy, href: '/terms/privacy' },
    { label: t.legal_terms,   href: '/terms' },
  ]

  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-muted)_40%,var(--color-background))]">
      <div className="container-page py-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">

          {/* Brand-Spalte */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
              <span>MSK Scripts</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[var(--color-muted-foreground)]">
              {t.footer_tagline}
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm" aria-label="Discord">
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" aria-label="GitHub">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Link-Spalten — Anzahl passt sich automatisch an (Flex ab lg, darunter umbrechendes Grid) */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:flex lg:gap-16">

          {/* Shop */}
          <div>
            <ColumnTitle>{t.footer_col_shop}</ColumnTitle>
            {/* Nur noch interne Seiten, die externen Links sind in Support bzw. Ecosystem. */}
            {shopLinks.map(l => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </div>

          {/* Ecosystem */}
          <div>
            <ColumnTitle>{t.footer_col_eco}</ColumnTitle>
            {ECOSYSTEM_LINKS.map(l => (
              <FooterLink key={l.href} href={l.href} external>{l.label}</FooterLink>
            ))}
          </div>

          {/* Support */}
          <div>
            <ColumnTitle>{t.footer_col_support}</ColumnTitle>
            {supportLinks.map(l => (
              <FooterLink key={l.href} href={l.href} external={l.external}>{l.label}</FooterLink>
            ))}
          </div>

          {/* Legal */}
          <div>
            <ColumnTitle>{t.footer_col_legal}</ColumnTitle>
            {legalLinks.map(l => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </div>

          </div>{/* /Link-Spalten */}
        </div>

        {/* Vertrauenszeile. Jede Aussage ist in den AGB gedeckt und verlinkt
            dorthin: § 2 Tebex als Merchant of Record, § 3 Single-Server-Lizenz,
            § 4 Rückerstattung im Einzelfall. */}
        <div className="mt-10 border-t border-[var(--color-border)] pt-6 text-center">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t.footer_trust_checkout}
          </p>
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[
              { icon: ShieldCheck, label: t.footer_trust_license, href: '/terms' },
              { icon: Undo2,       label: t.footer_trust_refund,  href: '/terms' },
              { icon: Receipt,     label: t.footer_trust_vat },
            ].map(item => (
              <li key={item.label} className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                <item.icon className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                {item.href ? (
                  <Link href={item.href} className="transition-colors hover:text-[var(--color-foreground)]">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
          <PaymentMarks label={t.footer_payment_label} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            © {new Date().getFullYear()} MSK Scripts. {t.footer_rights}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {t.footer_powered_by}{' '}
            <a href="https://tebex.io" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-foreground)] transition-colors">
              Tebex
            </a>
            {' · '}
            {t.footer_built_by}{' '}
            <a href="https://www.musiker15.de" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-foreground)] transition-colors">
              Musiker15
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
