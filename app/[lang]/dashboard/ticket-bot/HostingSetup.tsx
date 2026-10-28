'use client'

import { useId, useState } from 'react'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { FormField, FormSection } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { useLang } from '@/components/i18n/LangProvider'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import {
  Archive, ArrowCounterClockwise, ArrowSquareOut, CaretDown, CircleNotch, HardDrives, Trash,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/format'
import { dashboardTranslations } from '@/lib/i18n'
import { useJsonResource } from '@/lib/useAdminResource'
import { cn } from '@/lib/utils'
import { hostingEnvUrl, removeHosting, saveHosting, type HostingValues } from './ticketBotApi'

// ── Self-service bot hosting ────────────────────────────────────────────────
//
// Three states of one thing, and the customer moves between them without
// leaving the page:
//
//   not set up  → the instructions and the form
//   running     → the step the detached worker is on
//   failed      → the same form again, with the bot's own log above it
//
// The form is the out-of-band configuration layer. The bot's own dashboard can
// edit its .env too, but a bot whose token Discord rejected never starts, so its
// dashboard is precisely the thing you cannot reach.

export type Step = 'queued' | 'clone' | 'configure' | 'install' | 'start' | 'health' | 'done'

export interface HostingJob {
  status: 'running' | 'failed' | 'done'
  step:   Step
  error:  string | null
  log:    string | null
}

export interface BotArchive {
  name:       string
  archivedAt: string
}

/** What `/api/bot-hosting/status` answers under `status`. */
export interface HostingStatus {
  hosted:      boolean
  archives:    BotArchive[]
  host:        string | null
  url:         string | null
  redirectUri: string | null
  /** The bot is up but still holds example placeholders, so its ticket flow is
   *  closed. A separate state from `failed`: nothing is broken, something is
   *  unfinished, and the two need different words. */
  needsConfig: boolean
  job:         HostingJob | null
}

interface EnvValues {
  clientId:        string
  databaseUrl:     string
  publicPortal:    boolean
  tokenSet:        boolean
  clientSecretSet: boolean
}

type T = typeof dashboardTranslations['en'] | typeof dashboardTranslations['de']

export const STEP_LABEL = (t: T, step: Step): string => ({
  queued:    t.host_step_queued,
  clone:     t.host_step_clone,
  configure: t.host_step_configure,
  install:   t.host_step_install,
  start:     t.host_step_start,
  health:    t.host_step_health,
  done:      t.host_step_done,
}[step])

/** Map a server-side error key onto a sentence. Unknown keys fall back rather
 *  than rendering a raw identifier at the customer. */
export function errorText(t: T, key: string | null): string | null {
  if (!key) return null
  const map: Record<string, string> = {
    invalid_token:         t.host_err_invalid_token,
    invalid_client_id:     t.host_err_invalid_client_id,
    invalid_clientId:      t.host_err_invalid_client_id,
    invalid_client_secret: t.host_err_invalid_client_secret,
    invalid_clientSecret:  t.host_err_invalid_client_secret,
    invalid_database_url:  t.host_err_invalid_database_url,
    invalid_databaseUrl:   t.host_err_invalid_database_url,
    bot_not_in_guild:      t.host_err_bot_not_in_guild,
    health_not_running:    t.host_err_health_not_running,
    health_unreachable:    t.host_err_health_unreachable,
    in_progress:           t.host_err_in_progress,
    rate_limited:          t.host_err_rate_limited,
    dpa_required:          t.host_err_dpa,
    confirm_mismatch:      t.host_err_confirm,
  }
  return map[key] ?? t.host_err_generic
}

/** The error keys that belong to one field: the message stands at that field (plan 6.3). */
const FIELD_OF_ERROR: Record<string, keyof HostingValues> = {
  invalid_token:         'token',
  invalid_client_id:     'clientId',
  invalid_clientId:      'clientId',
  invalid_client_secret: 'clientSecret',
  invalid_clientSecret:  'clientSecret',
  invalid_database_url:  'databaseUrl',
  invalid_databaseUrl:   'databaseUrl',
}

export function RunningCard({ step }: { step: Step }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]
  return (
    <SectionCard title={t.host_title}>
      <div role="status" className="grid gap-2">
        <p className="flex items-center gap-2 font-semibold">
          <CircleNotch className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
          {STEP_LABEL(t, step)}
        </p>
        <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.host_running_note}</p>
      </div>
    </SectionCard>
  )
}

/**
 * Setting hosting up, or changing the credentials of a hosted bot, on the
 * shared form building blocks: two sections, every field with its label,
 * its hint and its own error.
 */
export function HostingSetup({ guildId, status, onDone }: {
  guildId: string
  status: HostingStatus | null
  onDone: () => void
}) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]
  const formId = useId()

  const hosted = !!status?.hosted
  const failed = status?.job?.status === 'failed'
  // Newest archive of this guild, if setting hosting up would collide with one.
  const archive = !hosted ? (status?.archives?.[0] ?? null) : null

  // Prefill from the .env once something is installed. The secrets come back
  // only as "set" flags, never as values. Before the first installation the
  // route answers `env: null`, which is why this is fetched unconditionally.
  const { data: env } = useJsonResource<EnvValues | null>(hostingEnvUrl(guildId), 'env', t.bot_err_network)

  const [token, setToken]               = useState('')
  const [clientId, setClientId]         = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [databaseUrl, setDatabaseUrl]   = useState('')
  const [portal, setPortal]             = useState(false)
  // One "has the customer typed here" flag per prefilled field. Without it the
  // loaded value would keep reappearing the moment they clear the box, and a
  // copy into state from an effect is exactly what this codebase does not do.
  const [touched, setTouched]           = useState<Record<string, boolean>>({})
  const [busy, setBusy]                 = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]   = useState<Partial<Record<keyof HostingValues, string>>>({})
  // Data processing (Art. 28 DSGVO). Only asked during the initial set-up:
  // saving the .env later does not conclude a new agreement.
  const [dpaAccepted, setDpaAccepted]   = useState(false)
  // What the customer decided about an existing archive. Asked BEFORE the
  // form: restoring must not require typing a bot token, and demanding one to
  // even reach the question would mean resetting it in Discord.
  const [archiveChoice, setArchiveChoice] = useState<'restore' | 'discard' | null>(null)
  const [discardOpen, setDiscardOpen]   = useState(false)

  // While this is true the form stays hidden: the question comes first.
  const undecided = !!archive && archiveChoice === null

  // Once installed the form is collapsed. It is the repair layer, not the
  // thing you came for. A failed run opens it, because then it IS.
  const [openedByUser, setOpenedByUser] = useState<boolean | null>(null)
  const showForm = hosted ? (openedByUser ?? failed) : true

  const mark = (k: string) => setTouched(prev => (prev[k] ? prev : { ...prev, [k]: true }))

  // Derived during render, never copied into state.
  const clientIdValue    = touched.clientId    ? clientId    : (env?.clientId    ?? '')
  const databaseUrlValue = touched.databaseUrl ? databaseUrl : (env?.databaseUrl ?? '')
  const portalValue      = touched.portal      ? portal      : (env?.publicPortal ?? false)

  async function submit(choice?: 'restore' | 'discard') {
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const { ok, status: code, data } = await saveHosting(guildId, {
        hosted,
        values: { token, clientId: clientIdValue, clientSecret, databaseUrl: databaseUrlValue, publicPortal: portalValue },
        dpaAccepted,
        archive: choice,
      })

      // A safety net rather than the normal path: the question is asked up
      // front from status.archives. Reaching this means an archive appeared
      // between loading the page and submitting.
      if (code === 409 && data.error === 'archive_choice_required') {
        setArchiveChoice(null)
        onDone()
        return
      }

      if (!ok) {
        const key = String(data.error ?? 'generic')
        const field = FIELD_OF_ERROR[key]
        if (field) setFieldErrors({ [field]: errorText(t, key) ?? t.host_err_generic })
        else setError(errorText(t, key))
        return
      }
      setToken(''); setClientSecret('')
      onDone()
    } catch {
      setError(t.host_err_generic)
    } finally {
      setBusy(false)
    }
  }

  const complete = hosted
    ? true                                  // secrets may stay empty to keep them
    : !!(token && clientIdValue && clientSecret)

  const archivedOn = archive ? (formatDate(archive.archivedAt, lang) ?? archive.archivedAt) : ''

  return (
    <SectionCard title={hosted ? t.host_edit_title : t.host_title} description={hosted ? t.host_edit_desc : t.host_intro}>
      <div className="grid gap-6">
        {failed && (
          <Notice tone="danger" role="alert" title={t.host_failed_title}>
            <p>{errorText(t, status?.job?.error ?? null)} {t.host_failed_hint}</p>
            {status?.job?.log && (
              <div className="mt-3 grid gap-1.5">
                <p className="font-semibold">{t.host_log_title}</p>
                <pre tabIndex={0} className="max-h-64 overflow-auto rounded-md bg-[var(--color-console)] p-3 font-mono text-[0.8125rem] leading-relaxed text-[var(--color-log-text)]">
                  {status.job.log}
                </pre>
              </div>
            )}
          </Notice>
        )}

        {/* Deliberately not an error. The install worked; what is missing are
            the channel and role ids, and the only place to enter them is the
            bot's own dashboard. */}
        {hosted && !failed && status?.needsConfig && (
          <Notice
            tone="warning"
            title={t.host_needs_config_title}
            action={status.url ? (
              <Button asChild variant="outline">
                <a href={status.url} target="_blank" rel="noopener noreferrer">
                  <ArrowSquareOut className="h-4 w-4" />
                  {t.host_needs_config_link}
                  <span className="sr-only">{t.opens_new_tab}</span>
                </a>
              </Button>
            ) : undefined}
          >
            {t.host_needs_config_desc}
          </Notice>
        )}

        {hosted && !failed && (
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => setOpenedByUser(!showForm)}
            aria-expanded={showForm}
            aria-controls={formId}
          >
            <CaretDown className={cn('h-4 w-4 transition-transform duration-150', showForm && 'rotate-180')} />
            {showForm ? t.host_edit_hide : t.host_edit_show}
          </Button>
        )}

        {undecided && archive && (
          <Notice tone="warning" role="alert" title={t.host_archive_title}>
            <p>{t.host_archive_desc.replace('{date}', archivedOn)}</p>
            <div className="mt-3 grid gap-4 @3xl:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <Button onClick={() => submit('restore')} disabled={busy} className="w-fit">
                  <ArrowCounterClockwise className="h-4 w-4" /> {t.host_archive_restore}
                </Button>
                <p className="text-[var(--color-muted-foreground)]">{t.host_archive_restore_hint}</p>
              </div>
              <div className="grid content-start gap-1.5">
                <Button variant="outline" onClick={() => setDiscardOpen(true)} disabled={busy} aria-haspopup="dialog" className="w-fit">
                  <Trash className="h-4 w-4" /> {t.host_archive_new}
                </Button>
                <p className="text-[var(--color-muted-foreground)]">{t.host_archive_new_hint}</p>
              </div>
            </div>
          </Notice>
        )}

        {!hosted && !undecided && (
          <div className="grid gap-3">
            <h3 className="font-semibold">{t.host_steps_title}</h3>
            <ol className="grid max-w-[65ch] gap-2.5">
              {[t.host_step1, t.host_step2, t.host_step3, t.host_step4].map((line, i) => (
                <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                  <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-[var(--color-primary)] font-semibold tabular-nums text-[var(--color-primary)]">
                    {i + 1}
                  </span>
                  <span className="pt-1">{line}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {showForm && !undecided && (
          <form
            id={formId}
            className="grid gap-2"
            onSubmit={e => { e.preventDefault(); void submit(archiveChoice ?? undefined) }}
          >
            {archiveChoice === 'discard' && (
              <Notice tone="warning">{t.host_archive_discard_chosen}</Notice>
            )}

            <FormSection title={t.host_section_app} description={t.host_section_app_desc}>
              <FormField
                label={t.host_token}
                required={!hosted}
                hint={hosted && env?.tokenSet ? `${t.host_token_hint}. ${t.host_secret_set}` : t.host_token_hint}
                error={fieldErrors.token}
                className="max-w-[40rem]"
              >
                {field => (
                  <Input {...field} type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="off" spellCheck={false} />
                )}
              </FormField>
              <FormField label={t.host_client_id} required={!hosted} hint={t.host_client_id_hint} error={fieldErrors.clientId} className="max-w-[40rem]">
                {field => (
                  <Input
                    {...field}
                    inputMode="numeric"
                    value={clientIdValue}
                    onChange={e => { mark('clientId'); setClientId(e.target.value) }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
              </FormField>
              <FormField
                label={t.host_client_secret}
                required={!hosted}
                hint={hosted && env?.clientSecretSet ? `${t.host_client_secret_hint}. ${t.host_secret_set}` : t.host_client_secret_hint}
                error={fieldErrors.clientSecret}
                className="max-w-[40rem]"
              >
                {field => (
                  <Input {...field} type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} autoComplete="off" spellCheck={false} />
                )}
              </FormField>
            </FormSection>

            <FormSection title={t.host_section_options} description={t.host_section_options_desc}>
              <FormField label={t.host_database} hint={t.host_database_hint} error={fieldErrors.databaseUrl} className="max-w-[40rem]">
                {field => (
                  <Input
                    {...field}
                    value={databaseUrlValue}
                    onChange={e => { mark('databaseUrl'); setDatabaseUrl(e.target.value) }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
              </FormField>
              <label className="flex max-w-[44rem] cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={portalValue}
                  onChange={e => { mark('portal'); setPortal(e.target.checked) }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                />
                <span className="grid gap-0.5">
                  <span className="font-semibold">{t.host_portal}</span>
                  <span className="text-small text-[var(--color-muted-foreground)]">{t.host_portal_hint}</span>
                </span>
              </label>
            </FormSection>

            <div className="grid gap-4 border-t border-[var(--color-border)] pt-6">
              {!hosted && <Notice tone="info">{t.host_after}</Notice>}

              {/* With hosting, more sits on our systems than with the plain
                  transcript service: the complete bot database including the
                  team's Discord ids. The agreement is confirmed separately. */}
              {!hosted && (
                <label className="flex min-h-11 max-w-[44rem] cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={dpaAccepted}
                    onChange={e => setDpaAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                  />
                  <span>
                    {t.dpa_accept}{' '}
                    <Link href="/legal/dpa" className="text-[var(--color-primary)] underline underline-offset-2">{t.dpa_link}</Link>
                  </span>
                </label>
              )}

              {error && <Notice tone="danger" role="alert">{error}</Notice>}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={busy || !complete || undecided || (!hosted && !dpaAccepted)}
                  aria-busy={busy || undefined}
                >
                  {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <HardDrives className="h-4 w-4" />}
                  {busy ? t.host_activating : hosted ? t.host_save_restart : t.host_activate}
                </Button>
                {/* Only while setting up. Once installed the portal link sits
                    in the address card, next to the redirect URI it belongs to. */}
                {!hosted && (
                  <Button asChild variant="ghost">
                    <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
                      <ArrowSquareOut className="h-4 w-4" />
                      {t.botdash_redirect_open}
                      <span className="sr-only">{t.opens_new_tab}</span>
                    </a>
                  </Button>
                )}
              </div>
              {!complete && !hosted && (
                <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.host_required}</p>
              )}
            </div>
          </form>
        )}
      </div>

      {archive && (
        <ConfirmDialog
          open={discardOpen}
          onClose={() => setDiscardOpen(false)}
          onConfirm={() => { setArchiveChoice('discard'); setDiscardOpen(false) }}
          title={t.host_archive_discard_title}
          description={t.host_archive_discard_desc}
          confirmLabel={t.host_archive_new}
          cancelLabel={t.cancel}
        />
      )}
    </SectionCard>
  )
}

/**
 * Removing hosting again, in the danger zone at the end of the page (plan
 * 6.4). Typing the server id is the confirmation: this stops a running bot
 * and takes its public address offline. The field starts empty; the id stands
 * in the label, not as a placeholder that looks filled in.
 */
export function RemoveHosting({ guildId, onDone }: { guildId: string; onDone: () => void }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]
  const [open, setOpen]   = useState(false)
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone]   = useState(false)

  async function remove(confirm: string) {
    setBusy(true)
    setError(null)
    try {
      const { ok, data } = await removeHosting(guildId, confirm)
      if (!ok) { setError(errorText(t, String(data.error ?? 'generic'))); return }
      setOpen(false)
      setDone(true)
      onDone()
    } catch {
      setError(t.host_err_generic)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      title={t.host_danger_title}
      className="border-[var(--color-danger)]"
    >
      <div className="grid gap-3">
        <h3 className="font-semibold text-[var(--color-danger)]">{t.host_remove_title}</h3>
        <p className="max-w-[65ch] text-small text-[var(--color-muted-foreground)]">{t.host_remove_desc}</p>
        {done && <Notice tone="success" role="status">{t.host_removed}</Notice>}
        <Button
          variant="outline"
          className="w-fit border-[var(--color-danger)] text-[var(--color-danger)] hover:border-[var(--color-danger)]"
          onClick={() => { setError(null); setOpen(true) }}
          aria-haspopup="dialog"
        >
          <Archive className="h-4 w-4" />
          {t.host_remove}
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={remove}
        title={t.host_remove_confirm_title}
        description={t.host_remove_desc}
        confirmLabel={t.host_remove}
        cancelLabel={t.cancel}
        busy={busy}
        error={error}
        typeToConfirm={{
          expected: guildId,
          label: <>{t.host_remove_confirm} <code className="font-mono">{guildId}</code></>,
        }}
      />
    </SectionCard>
  )
}
