import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { ShopSignIn } from '@/components/account/ShopSignIn'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowRight, ArrowSquareOut, CheckCircle, Minus } from '@/components/icons'
import { PageHead } from '@/components/page/PageHead'
import { Button } from '@/components/ui/Button'
import { getDashboardUserId } from '@/lib/dashboardAuth'
import { GIVEAWAY_SESSION_COOKIE, parseGiveawaySession } from '@/lib/giveawaySession'
import { accountTranslations, layoutTranslations, packagesTranslations, type Lang } from '@/lib/i18n'
import { pageSeo } from '@/lib/pageSeo'
import { getRequestLang } from '@/lib/serverLang'

// Reads the two bot session cookies, so it can never be static.
export const dynamic = 'force-dynamic'

/**
 * Own title instead of the default from the root layout. No `alternates`:
 * the page is noindex; a canonical or hreflang on it would be a signal
 * for something that is not meant to be in the index at all.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getRequestLang()
  const seo = pageSeo('/account', lang)
  return {
    title:       seo.title,
    description: seo.description,
    robots:      { index: false, follow: false },
  }
}

const TEBEX_HISTORY = 'https://checkout.tebex.io/payment-history'
const KEYMASTER = 'https://portal.cfx.re/'

/**
 * Whether the visitor holds a valid, signed session for each bot dashboard.
 * Only that yes or no is used here: no Discord or guild id leaves the server,
 * and the dashboards themselves keep deciding what they show (the Ticket Bot
 * one re-checks the Discord rights first). A missing secret or a broken token
 * counts as signed out.
 */
async function botSessions(): Promise<{ ticket: boolean; giveaway: boolean }> {
  const store = await cookies()
  let ticket = false
  let giveaway = false
  try { ticket = Boolean(await getDashboardUserId()) } catch { /* signed out */ }
  try { giveaway = Boolean(parseGiveawaySession(store.get(GIVEAWAY_SESSION_COOKIE)?.value)?.guildId) } catch { /* signed out */ }
  return { ticket, giveaway }
}

/** A row that leads somewhere: title, a line under it, an arrow. */
function LinkRow({ href, title, sub, newTab }: { href: string; title: string; sub: string; newTab?: string }) {
  const body = (
    <>
      <span className="grid gap-0.5">
        <span className="font-semibold group-hover:text-[var(--color-primary)]">{title}</span>
        <span className="text-small text-[var(--color-muted-foreground)]">{sub}</span>
      </span>
      {newTab
        ? <ArrowSquareOut className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
        : <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />}
    </>
  )
  const cls = 'group flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-border)] py-3'
  return (
    <li>
      {newTab ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          {body}
          <span className="sr-only"> {newTab}</span>
        </a>
      ) : (
        <Link href={href} className={cls}>{body}</Link>
      )}
    </li>
  )
}

function Block({ id, kicker, title, lead, children }: { id: string; kicker: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid content-start gap-4 border-t-2 border-[var(--color-primary)] pt-[clamp(1rem,0.75rem+0.75vw,1.75rem)]">
      <div className="grid gap-2">
        <span className="kicker">{kicker}</span>
        <h2 id={id} className="font-display text-h2 font-bold tracking-[-0.015em]">{title}</h2>
        {lead && <p className="max-w-[34rem] text-[var(--color-muted-foreground)]">{lead}</p>}
      </div>
      {children}
    </section>
  )
}

function BotRow({ lang, href, name, sub, signedIn }: { lang: Lang; href: string; name: string; sub: string; signedIn: boolean }) {
  const t = accountTranslations[lang]
  return (
    <li className="grid gap-3 border-b border-[var(--color-border)] py-4 @md:grid-cols-[minmax(0,1fr)_auto] @md:items-center @md:gap-x-6">
      <div className="grid gap-1">
        <h3 className="font-display text-h3 font-[650]">{name}</h3>
        <p className="text-small text-[var(--color-muted-foreground)]">{sub}</p>
        {/* Word and sign, never colour alone (plan 4.4). */}
        <p className="flex items-center gap-1.5 text-small font-semibold">
          {signedIn
            ? <CheckCircle className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
            : <Minus className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />}
          {signedIn ? t.bot_signed_in : t.bot_signed_out}
        </p>
      </div>
      {/* The dashboard sends a visitor without a session to its Discord
          sign-in, so one address serves both states. Not prefetched: the
          answer depends on the session. */}
      <Button asChild variant={signedIn ? 'primary' : 'outline'} className="justify-self-start">
        <Link href={href} prefetch={false}>{signedIn ? t.bot_open : t.bot_sign_in}</Link>
      </Button>
    </li>
  )
}

/**
 * `/en/account`, `/de/konto` (plan 5.2): purchases and bots in one place.
 *
 * What the shop can show: the CFX.re sign-in of the shop and the way to
 * Tebex' purchase history and the CFX.re Keymaster. Tebex keeps the orders;
 * the Headless API has no endpoint for a buyer's past purchases, and the shop
 * stores none, so there is no list of bought scripts here. For the bots: the
 * sign-in state of each dashboard and its address; plan, billing and servers
 * stay in the dashboards, which check the Discord rights before they show
 * any of it.
 */
export default async function AccountPage() {
  const [{ lang }, sessions] = await Promise.all([getRequestLang(), botSessions()])
  const t = accountTranslations[lang]
  const tl = layoutTranslations[lang]

  return (
    <div className="container-page grid gap-[var(--space-section)] pb-[var(--space-section)] pt-[clamp(1rem,0.5rem+1.5vw,3rem)]">
      <PageHead
        id="account-title"
        crumbs={[{ label: packagesTranslations[lang].breadcrumb_home, href: '/' }, { label: tl.account_label }]}
        title={t.title}
        lead={t.lead}
      />

      <div className="@container">
        <div className="grid gap-[var(--space-section)] @5xl:grid-cols-2 @5xl:gap-x-[clamp(2rem,4cqi,6rem)]">
          <Block id="account-shop" kicker={t.shop_kicker} title={t.shop_title}>
            <ShopSignIn />
            <ul className="grid border-t border-[var(--color-border)]">
              <LinkRow href={TEBEX_HISTORY} title={t.shop_history} sub={t.shop_history_sub} newTab={tl.nav_new_tab} />
              <LinkRow href={KEYMASTER} title={t.shop_downloads} sub={t.shop_downloads_sub} newTab={tl.nav_new_tab} />
            </ul>
          </Block>

          <Block id="account-bots" kicker={t.bots_kicker} title={t.bots_title} lead={t.bots_lead}>
            <ul className="@container grid border-t border-[var(--color-border)]">
              <BotRow lang={lang} href="/dashboard/ticket-bot" name={t.ticket_name} sub={t.ticket_sub} signedIn={sessions.ticket} />
              <BotRow lang={lang} href="/dashboard/giveaway-bot" name={t.giveaway_name} sub={t.giveaway_sub} signedIn={sessions.giveaway} />
            </ul>
          </Block>
        </div>
      </div>

      <Block id="account-contracts" kicker={t.contracts_kicker} title={t.contracts_title} lead={t.contracts_lead}>
        <ul className="grid max-w-[48rem] border-t border-[var(--color-border)]">
          <LinkRow href="/withdraw-contract?contract=subscription" title={tl.legal_revoke} sub={t.ticket_name + ', MSK Forms'} />
          <LinkRow href="/cancel-contract" title={tl.legal_cancel} sub={t.ticket_name + ', MSK Forms'} />
        </ul>
      </Block>
    </div>
  )
}
