'use client'

import Image from 'next/image'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, ArrowSquareOut, Receipt, Scales, ShieldCheck, ArrowCounterClockwise } from '@/components/icons'
import { GithubMark } from '@/components/icons/GithubMark'
import { useLang } from '@/components/i18n/LangProvider'
import { prefetchFor } from '@/components/layout/navigation'
import { PaymentMarks } from '@/components/layout/PaymentMarks'
import { ThemeSwitch } from '@/components/theme/ThemeSwitch'
import { SITE_CONFIG } from '@/lib/config'
import { layoutTranslations, type Lang } from '@/lib/i18n'
import { hasClosingBand, isShopPath } from '@/lib/routes'

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

/**
 * The four link columns (plan 5.10). Exported for the test that holds the
 * legal and contract links to their routes: the imprint must be one click
 * away (§ 5 DDG), and "Vertrag widerrufen" and "Verträge hier kündigen" keep
 * their prescribed wording (§ 356a, § 312k BGB).
 */
export function footerColumns(lang: Lang): Array<{ title: string; links: FooterLink[] }> {
  const t = layoutTranslations[lang]
  return [
    {
      title: t.footer_col_products,
      links: [
        { label: t.nav_fivem,      href: '/fivem' },
        { label: t.nav_fivem_free, href: '/fivem/free' },
        { label: 'Ticket Bot',     href: '/discord/ticket-bot' },
        { label: 'Giveaway Bot',   href: '/discord/giveaway-bot' },
        { label: t.nav_tools,      href: '/tools' },
        { label: t.nav_images,     href: '/tools/images' },
      ],
    },
    {
      title: t.footer_col_help,
      links: [
        { label: t.footer_documentation, href: SITE_CONFIG.docs,    external: true },
        { label: t.footer_discord,       href: SITE_CONFIG.discord, external: true },
        { label: t.footer_statistics,    href: '/stats' },
      ],
    },
    {
      title: t.footer_col_legal,
      links: [
        { label: t.legal_imprint,  href: '/legal/imprint' },
        { label: t.legal_privacy,  href: '/legal/privacy' },
        { label: t.legal_terms,    href: '/legal/terms' },
        { label: t.legal_widerruf, href: '/legal/withdrawal' },
        { label: t.legal_avv,      href: '/legal/dpa' },
      ],
    },
    {
      // A column of its own, not under "Legal": § 356a and § 312k BGB ask for
      // a clearly visible button, and between five text pages it would not
      // be one. The labels must not be shortened to "Widerruf" or "Kündigung".
      title: t.footer_col_duties,
      links: [
        { label: t.legal_revoke, href: '/withdraw-contract' },
        { label: t.legal_cancel, href: '/cancel-contract' },
        { label: t.legal_report, href: '/report' },
      ],
    },
  ]
}

/**
 * The trust line. Every claim links to the text that backs it: § 3 of the
 * T&C (licence), the withdrawal instructions (statutory rights), § 2 (3) of
 * the T&C (refunds via Tebex). The wording lives in lib/i18n.ts and is legal
 * text, not copy.
 */
export function trustItems(lang: Lang) {
  const t = layoutTranslations[lang]
  return [
    { icon: ShieldCheck,           label: t.footer_trust_license,   href: '/legal/terms' },
    { icon: Scales,                label: t.footer_trust_statutory, href: '/legal/withdrawal' },
    { icon: ArrowCounterClockwise, label: t.footer_trust_refund,    href: '/legal/terms' },
    { icon: Receipt,               label: t.footer_trust_vat },
  ]
}

const linkClass =
  'inline-flex min-h-11 items-center gap-1.5 text-[var(--color-band-muted)] transition-colors duration-150 ' +
  'hover:text-[var(--color-band-foreground)] hover:underline underline-offset-4'

function ColumnLink({ link, newTab }: { link: FooterLink; newTab: string }) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {link.label}
        <ArrowSquareOut className="h-3.5 w-3.5" />
        <span className="sr-only"> {newTab}</span>
      </a>
    )
  }
  return <Link href={link.href} prefetch={prefetchFor(link.href)} className={linkClass}>{link.label}</Link>
}

/**
 * The green closing band right above the footer (sample page of Phase 0):
 * support from the person who wrote the script, and the documentation as the
 * second way. No second call to buy.
 */
function ClosingBand({ lang }: { lang: Lang }) {
  const t = layoutTranslations[lang]
  return (
    <section aria-labelledby="closing-band-title" className="surface-brand">
      <div className="container-page grid items-center gap-x-12 gap-y-6 py-[clamp(2.5rem,1.5rem+3vw,7.5rem)] min-[1024px]:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-2.5">
          <h2 id="closing-band-title" className="max-w-[24ch] text-h2 font-bold tracking-[-0.015em]">
            {t.band_title}
          </h2>
          <p className="max-w-[46ch] text-lead text-[var(--color-brand-muted)]">{t.band_text}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href={SITE_CONFIG.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--color-brand-button)] px-[1.125rem] py-2 font-semibold text-[var(--color-brand-button-foreground)] transition-colors duration-150 hover:bg-[var(--color-brand-muted)]"
          >
            {t.band_button}
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only"> {t.nav_new_tab}</span>
          </a>
          <a
            href={SITE_CONFIG.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-[var(--color-brand-foreground)] underline underline-offset-4 hover:text-[var(--color-brand-muted)]"
          >
            {t.band_docs}
            <span className="sr-only"> {t.nav_new_tab}</span>
          </a>
        </div>
      </div>
    </section>
  )
}

/**
 * Footer (plan 5.10): four columns on the anthracite band, the trust line with
 * its legal wording, payment marks on shop pages only, one bottom line.
 */
export function Footer() {
  const { lang, path } = useLang()
  const t = layoutTranslations[lang]

  return (
    <footer>
      {hasClosingBand(path) && <ClosingBand lang={lang} />}

      <div className="surface-band">
        <div className="container-page grid gap-12 py-[clamp(3rem,2rem+3vw,6rem)]">
          <div className="@container">
            <div className="grid gap-x-10 gap-y-10 @lg:grid-cols-2 @4xl:grid-cols-4 @7xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
              <div className="grid content-start gap-4 @lg:col-span-2 @4xl:col-span-4 @7xl:col-span-1">
                <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 self-start text-[var(--color-band-foreground)]">
                  <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
                  <span className="font-display text-lead font-bold [font-stretch:108%]">MSK Scripts</span>
                </Link>
                <div className="grid gap-2">
                  <p className="text-small font-semibold">{t.action_theme}</p>
                  <ThemeSwitch tone="band" />
                </div>
              </div>

              {footerColumns(lang).map(col => (
                <div key={col.title} className="grid content-start gap-2">
                  <h2 className="text-label font-semibold uppercase tracking-[0.08em] text-[var(--color-band-foreground)]">
                    {col.title}
                  </h2>
                  <ul>
                    {col.links.map(link => (
                      <li key={link.href}>
                        <ColumnLink link={link} newTab={t.nav_new_tab} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--color-band-line)] pt-8 text-small text-[var(--color-band-muted)]">
            <p>{t.footer_trust_checkout}</p>
            <ul className="flex flex-wrap gap-x-6">
              {trustItems(lang).map(item => (
                <li key={item.label} className="flex min-h-11 items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0 text-[var(--color-band-accent)]" />
                  {item.href ? (
                    <Link href={item.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-[var(--color-band-foreground)] hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
            {isShopPath(path) && <PaymentMarks label={t.footer_payment_label} />}
          </div>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-band-line)] pt-6 text-small text-[var(--color-band-muted)]">
            <span>© {new Date().getFullYear()} MSK Scripts. {t.footer_rights}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t.footer_powered_by}{' '}
              <a href="https://tebex.io" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[var(--color-band-foreground)] hover:underline">Tebex</a>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t.footer_built_by}{' '}
              <a href="https://www.musiker15.de" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[var(--color-band-foreground)] hover:underline">Musiker15</a>
            </span>
            <span aria-hidden="true">·</span>
            <a href={SITE_CONFIG.github} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 underline-offset-4 hover:text-[var(--color-band-foreground)] hover:underline">
              <GithubMark className="h-4 w-4" />
              GitHub
              <span className="sr-only"> {t.nav_new_tab}</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
