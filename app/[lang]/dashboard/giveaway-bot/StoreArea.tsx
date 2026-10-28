'use client'

import { useState } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { CopyField } from '@/components/dashboard/CopyField'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { useLang } from '@/components/i18n/LangProvider'
import { CircleNotch, Eye, EyeSlash, FloppyDisk, Trash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, formatNumber, isoDate } from '@/lib/format'
import { clearTebexSecret, revealTebexSecret, saveTebexSecret, saveTebexStore } from './giveawayApi'
import type { TebexStatus } from './giveawayModel'
import { FlashNotice, useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { WIDTH } from './formParts'
import { errorText, useBusy } from './useGiveawayAction'

/**
 * The Tebex store of this server (plan 6.5), for its owner only: the page
 * and its entry exist for the owner alone, and the bot checks every call
 * against guild.ownerId itself.
 *
 * The plugin secret is full access to the owner's shop. It is stored
 * encrypted at the bot, arrives here masked (last four characters) and is
 * loaded in plain text only on an explicit click. Removing it sits in a
 * danger zone and asks first.
 */
export function StoreArea() {
  const { t, lang } = useGiveawayCopy()
  const { path } = useLang()
  const d = useGiveawayData()
  const tebex = d.tebex
  const { busy, run } = useBusy()
  const [secret, setSecret] = useState('')
  const [revealed, setRevealed] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState(tebex?.publicToken ?? '')
  const [storeUrl, setStoreUrl] = useState(tebex?.storeUrl ?? '')
  const [store, setStore] = useState<string | null>(null)
  const [secretError, setSecretError] = useState<string | null>(null)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearError, setClearError] = useState<string | null>(null)

  if (!tebex) return <EmptyState kind="error" title={t.store_unavailable_title}>{t.store_unavailable}</EmptyState>

  const changed = (s: Partial<TebexStatus>) => d.setTebex({ ...tebex, ...s })

  async function saveSecret() {
    if (!secret.trim()) { setSecretError(t.store_err_empty); return }
    const res = await run('secret', () => saveTebexSecret(secret))
    if (!res.ok) { setSecretError(errorText(t, res)); return }
    setSecretError(null)
    setSecret('')
    setRevealed(null)
    setStore(res.data.store ?? null)
    changed({ configured: true, hint: res.data.hint ?? null, setAt: new Date().toISOString() })
    d.setFlash({ tone: 'success', text: t.done_secret, path })
  }

  async function reveal() {
    if (revealed) { setRevealed(null); return }
    const res = await run('reveal', () => revealTebexSecret())
    if (!res.ok) { setSecretError(errorText(t, res)); return }
    if (res.data.secret) setRevealed(res.data.secret)
  }

  async function clear() {
    const res = await run('clear', () => clearTebexSecret())
    if (!res.ok) { setClearError(errorText(t, res)); return }
    setConfirmOpen(false)
    setRevealed(null)
    setStore(null)
    changed({ configured: false, hint: null, setAt: null })
    d.setFlash({ tone: 'success', text: t.done_secret_removed, path })
  }

  async function saveStore() {
    const res = await run('store', () => saveTebexStore(publicToken, storeUrl))
    if (!res.ok) { setStoreError(errorText(t, res)); return }
    setStoreError(null)
    changed({ publicToken: publicToken.trim() || null, storeUrl: storeUrl.trim() || null })
    d.setFlash({ tone: 'success', text: t.done_store, path })
  }

  const since = formatDate(tebex.setAt, lang)

  return (
    <div className="grid max-w-[60rem] gap-[var(--app-gutter-y)]">
      <FlashNotice />

      <SectionCard title={t.store_title} description={t.store_intro}>
        <div className="grid gap-5">
          {!tebex.encryptionReady && <Notice tone="danger" role="alert">{t.store_no_key}</Notice>}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {tebex.configured ? (
              <>
                <StatusBadge tone="success">{t.store_set}</StatusBadge>
                <span className="font-mono">•••• {tebex.hint}</span>
                {since && <span className="text-small text-[var(--color-muted-foreground)]">{t.store_since}{' '}<time dateTime={isoDate(tebex.setAt)}>{since}</time></span>}
                {store && <span className="text-small text-[var(--color-muted-foreground)]">{t.store_verified.replace('{store}', store)}</span>}
              </>
            ) : (
              <StatusBadge tone="neutral">{t.store_not_set}</StatusBadge>
            )}
          </div>

          {revealed && (
            <CopyField
              label={t.store_secret}
              value={revealed}
              copy={{ copy: t.copy, copied: t.copied, failed: t.copy_failed }}
            />
          )}

          <FormField label={tebex.configured ? t.store_secret_new : t.store_secret} hint={t.store_note} error={secretError ?? undefined}>
            {field => (
              <Input {...field} type="password" value={secret} autoComplete="off" spellCheck={false}
                onChange={e => setSecret(e.target.value)} className={WIDTH.text} />
            )}
          </FormField>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void saveSecret()} disabled={busy !== null || !tebex.encryptionReady} aria-busy={busy === 'secret' || undefined}>
              {busy === 'secret' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
              {t.store_save}
            </Button>
            {tebex.configured && (
              <Button variant="outline" onClick={() => void reveal()} disabled={busy !== null} aria-pressed={revealed !== null}>
                {revealed ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {revealed ? t.store_hide : t.store_reveal}
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t.store_public_title} description={t.store_public_desc}>
        <div className="grid gap-5">
          <FormField label={t.store_public}>
            {field => <Input {...field} value={publicToken} autoComplete="off" spellCheck={false} onChange={e => setPublicToken(e.target.value)} className={WIDTH.text} />}
          </FormField>
          <FormField label={t.store_url} hint={t.store_url_hint} error={storeError ?? undefined}>
            {field => <Input {...field} type="url" value={storeUrl} autoComplete="off" onChange={e => setStoreUrl(e.target.value)} className={WIDTH.text} />}
          </FormField>
          {d.packages.length > 0 && (
            <p className="text-small text-[var(--color-muted-foreground)]">{t.store_packages.replace('{n}', formatNumber(d.packages.length, lang))}</p>
          )}
          <div>
            <Button onClick={() => void saveStore()} disabled={busy !== null} aria-busy={busy === 'store' || undefined}>
              {busy === 'store' ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
              {t.store_save_store}
            </Button>
          </div>
        </div>
      </SectionCard>

      {tebex.configured && (
        <SectionCard title={t.danger_zone} className="border-[var(--color-danger)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="grid max-w-[65ch] gap-1">
              <p className="font-semibold">{t.store_clear}</p>
              <p className="text-small text-[var(--color-muted-foreground)]">{t.store_clear_hint}</p>
            </div>
            <Button variant="danger" onClick={() => { setClearError(null); setConfirmOpen(true) }} disabled={busy !== null}>
              <Trash className="h-4 w-4" />
              {t.store_clear}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => void clear()}
            title={t.cf_store_clear_title}
            description={t.cf_store_clear_desc}
            confirmLabel={t.store_clear}
            cancelLabel={t.dlg_back}
            busy={busy === 'clear'}
            error={clearError}
          />
        </SectionCard>
      )}
    </div>
  )
}
