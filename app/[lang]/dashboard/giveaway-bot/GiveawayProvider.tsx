'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { Notice, type NoticeTone } from '@/components/dashboard/Notice'
import { useLang } from '@/components/i18n/LangProvider'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowsClockwise } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { giveawayDashboardTranslations, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { fetchData, loadDashboard, type DataKind } from './giveawayApi'
import type { Channel, Giveaway, Role, Settings, TebexPackage, TebexStatus, Template } from './giveawayModel'

export type GiveawayCopy = typeof giveawayDashboardTranslations['en'] | typeof giveawayDashboardTranslations['de']

/**
 * A message that outlives the page it was made on: "Template saved" after the
 * editor has sent the visitor back to the list. Shown on `path` only, so it
 * does not follow anyone into another area.
 */
export interface Flash {
  tone: NoticeTone
  text: string
  path: string
  link?: { href: string; label: string }
}

export interface GiveawayData {
  owner:           boolean
  loading:         boolean
  /** The load failed as a whole; areas show it instead of their content. */
  error:           string | null
  giveaways:       Giveaway[]
  templates:       Template[]
  settings:        Settings | null
  setSettings:     (s: Settings) => void
  roles:           Role[]
  channels:        Channel[]
  tebex:           TebexStatus | null
  setTebex:        (s: TebexStatus) => void
  packages:        TebexPackage[]
  /** When the lists were read: relative times ("in 3 hours") count from here. */
  loadedAt:        number
  loadAll:         () => Promise<void>
  reloadGiveaways: () => Promise<void>
  reloadTemplates: () => Promise<void>
  flash:           Flash | null
  setFlash:        (f: Flash | null) => void
}

export const GiveawayDataContext = createContext<GiveawayData | null>(null)

export function useGiveawayData(): GiveawayData {
  const data = useContext(GiveawayDataContext)
  if (!data) throw new Error('GiveawayProvider is missing')
  return data
}

/** The dashboard's texts in the language of the page. */
export function useGiveawayCopy(): { t: GiveawayCopy; lang: Lang } {
  const { lang } = useLang()
  return { t: giveawayDashboardTranslations[lang], lang }
}

/**
 * Loads what the dashboard shows, once per visit, and keeps it while the
 * visitor moves between its areas.
 *
 * Sits in the layout of the signed-in pages, above the page that changes per
 * area, so moving between their addresses does not load it again. The guild
 * comes from the signed giveaway session on the server side of every request
 * (`/api/giveaway/data`), never from here.
 */
export function GiveawayProvider({ owner, children }: { owner: boolean; children: ReactNode }) {
  const router = useRouter()
  const { lang, localize } = useLang()
  const t = giveawayDashboardTranslations[lang]
  // A string, so it is stable across renders and safe in the deps below.
  const verifyHref = localize('/dashboard/giveaway-bot/verify')
  const [giveaways, setGiveaways] = useState<Giveaway[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [tebex, setTebex] = useState<TebexStatus | null>(null)
  const [packages, setPackages] = useState<TebexPackage[]>([])
  const [loadedAt, setLoadedAt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<Flash | null>(null)

  const get = useCallback(async (kind: DataKind) => {
    const { status, data } = await fetchData(kind)
    if (status === 401) { router.push(verifyHref); return null }
    return data as Record<string, unknown> | null
  }, [router, verifyHref])

  const reloadGiveaways = useCallback(async () => {
    const d = await get('giveaways')
    if (d?.giveaways) { setGiveaways(d.giveaways as Giveaway[]); setLoadedAt(Date.now()) }
  }, [get])

  const reloadTemplates = useCallback(async () => {
    const d = await get('templates')
    if (d?.templates) setTemplates(d.templates as Template[])
  }, [get])

  // Only touches state after the await, so the mount effect below causes no
  // extra render pass (`loading` and `error` already start out correct).
  const runLoadAll = useCallback(async () => {
    try {
      const b = await loadDashboard(get, owner)
      if (b.giveaways) setGiveaways(b.giveaways as Giveaway[])
      if (b.templates) setTemplates(b.templates as Template[])
      if (b.settings) setSettings(b.settings as Settings)
      if (b.roles) setRoles(b.roles as Role[])
      if (b.channels) setChannels(b.channels as Channel[])
      if (b.tebex) setTebex(b.tebex as TebexStatus)
      if (b.packages) setPackages(b.packages as TebexPackage[])
      setLoadedAt(Date.now())
    } catch {
      setError(t.err_load)
    } finally {
      setLoading(false)
    }
  }, [get, t, owner])

  /** Refresh from a user action: shows the loading state right away. */
  const loadAll = useCallback(() => {
    setLoading(true)
    setError(null)
    return runLoadAll()
  }, [runLoadAll])

  useEffect(() => {
    async function run() { await runLoadAll() }
    run()
  }, [runLoadAll])

  const value: GiveawayData = {
    owner, loading, error, giveaways, templates, settings, setSettings,
    roles, channels, tebex, setTebex, packages, loadedAt, loadAll, reloadGiveaways, reloadTemplates,
    flash, setFlash,
  }

  return <GiveawayDataContext.Provider value={value}>{children}</GiveawayDataContext.Provider>
}

/** The refresh action in the page head: loads everything again. */
export function GiveawayRefreshButton() {
  const { t } = useGiveawayCopy()
  const { loadAll, loading } = useGiveawayData()
  return (
    <Button variant="outline" onClick={loadAll} disabled={loading} aria-busy={loading || undefined}>
      <ArrowsClockwise className={cn('h-4 w-4', loading && 'animate-spin')} />
      {t.refresh}
    </Button>
  )
}

/** The message left for this page, if any, with its one next step. */
export function FlashNotice() {
  const { t } = useGiveawayCopy()
  const { path } = useLang()
  const { flash, setFlash } = useGiveawayData()
  if (!flash || flash.path !== path) return null
  return (
    <Notice
      tone={flash.tone}
      role={flash.tone === 'danger' ? 'alert' : 'status'}
      onDismiss={() => setFlash(null)}
      dismissLabel={t.dismiss}
      action={flash.link && (
        <Button asChild variant="outline">
          <Link href={flash.link.href} prefetch={false}>{flash.link.label}</Link>
        </Button>
      )}
    >
      {flash.text}
    </Notice>
  )
}
