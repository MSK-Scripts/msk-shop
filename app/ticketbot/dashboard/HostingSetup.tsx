'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Archive, ChevronDown, ExternalLink, Info, Loader2, RotateCcw, Server, Trash2 } from 'lucide-react'
import { dashboardTranslations } from '@/lib/i18n'
import { useLang }               from '@/components/i18n/LangProvider'
import { useJsonResource }       from '@/lib/useAdminResource'
import { Button }                from '@/components/ui/Button'
import { Input }                 from '@/components/ui/Input'

// ── Self-service bot hosting ────────────────────────────────────────────────
//
// Three states in one component, because they are three views of one thing and
// the customer moves between them without leaving the tab:
//
//   not set up  → the instructions and the form
//   running     → the step the detached worker is on
//   failed      → the same form again, with the bot's own log above it
//
// The form is the out-of-band configuration layer. The bot's own dashboard can
// edit its .env too, but a bot whose token Discord rejected never starts, so its
// dashboard is precisely the thing you cannot reach. That is why this exists
// here and the config editor does not.

type Step = 'queued' | 'clone' | 'configure' | 'install' | 'start' | 'health' | 'done'

interface Job {
  status: 'running' | 'failed' | 'done'
  step:   Step
  error:  string | null
  log:    string | null
}

interface BotArchive {
  name:       string
  archivedAt: string
}

interface Status {
  hosted:      boolean
  archives:    BotArchive[]
  host:        string | null
  url:         string | null
  redirectUri: string | null
  job:         Job | null
}

interface EnvValues {
  clientId:        string
  databaseUrl:     string
  publicPortal:    boolean
  tokenSet:        boolean
  clientSecretSet: boolean
}

type T = typeof dashboardTranslations['en'] | typeof dashboardTranslations['de']

const STEP_LABEL = (t: T, step: Step): string => ({
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
function errorText(t: T, key: string | null): string | null {
  if (!key) return null
  const map: Record<string, string> = {
    invalid_token:         t.host_err_invalid_token,
    invalid_client_id:     t.host_err_invalid_client_id,
    invalid_clientId:      t.host_err_invalid_client_id,
    invalid_client_secret: t.host_err_invalid_client_secret,
    invalid_clientSecret:  t.host_err_invalid_client_secret,
    invalid_database_url:  t.host_err_invalid_database_url,
    invalid_databaseUrl:   t.host_err_invalid_database_url,
    health_not_running:    t.host_err_health_not_running,
    health_unreachable:    t.host_err_health_unreachable,
    in_progress:           t.host_err_in_progress,
    rate_limited:          t.host_err_rate_limited,
  }
  return map[key] ?? t.host_err_generic
}

function Field({
  label, hint, value, onChange, type = 'text', placeholder, required,
}: {
  label: string; hint: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}{required && <span className="text-[var(--color-danger)]"> *</span>}
      </span>
      <Input type={type} value={value} placeholder={placeholder}
             onChange={e => onChange(e.target.value)} autoComplete="off" spellCheck={false} />
      <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">{hint}</span>
    </label>
  )
}

export default function HostingSetup({ guildId }: { guildId: string }) {
  const { lang } = useLang()
  const t = dashboardTranslations[lang]

  const { data: status, error: loadError, reload } = useJsonResource<Status>(
    `/api/bot-hosting/status?guildId=${encodeURIComponent(guildId)}`, 'status', t.bot_err_network)

  const running = status?.job?.status === 'running'

  // Poll only while a run is actually in flight. `reload` touches state strictly
  // after its await, which is the same shape useJsonResource itself uses in its
  // mount effect and the reason this stays clear of set-state-in-effect.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => { void reload() }, 3000)
    return () => window.clearInterval(id)
  }, [running, reload])

  return (
    // Only the gap between this component's OWN two cards. The distance to the
    // cards above comes from the tab container, so nothing here has to know
    // what is rendered next to it.
    <div className="space-y-4">
      {loadError && <p role="alert" className="text-sm text-[var(--color-danger)]">{loadError}</p>}

      {running
        ? <RunningCard step={status!.job!.step} t={t} />
        : <SetupCard guildId={guildId} status={status} t={t} onDone={reload} />}
    </div>
  )
}

function RunningCard({ step, t }: { step: Step; t: T }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
        {STEP_LABEL(t, step)}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{t.host_running_note}</p>
    </div>
  )
}

function SetupCard({
  guildId, status, t, onDone,
}: { guildId: string; status: Status | null; t: T; onDone: () => void }) {
  const hosted = !!status?.hosted
  const failed = status?.job?.status === 'failed'
  // Newest archive of this guild, if setting hosting up would collide with one.
  const archive = !hosted ? (status?.archives?.[0] ?? null) : null

  // Prefill from the .env once something is installed. The secrets come back
  // only as "set" flags, never as values. Before the first installation the
  // route answers `env: null`, which is why this is fetched unconditionally.
  const { data: env } = useJsonResource<EnvValues | null>(
    `/api/bot-hosting/env?guildId=${encodeURIComponent(guildId)}`, 'env', t.bot_err_network)

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
  // What the customer decided about an existing archive. The question is asked
  // BEFORE the form, not after a rejected submit: restoring must not require
  // typing a bot token, and demanding one to even reach the question would mean
  // resetting it in Discord — which is a reinstallation, not a comeback.
  const [archiveChoice, setArchiveChoice] = useState<'restore' | 'discard' | null>(null)

  // While this is true the form stays hidden: the question comes first.
  const undecided = !!archive && archiveChoice === null

  // Once installed the form is collapsed. It is the repair layer, not the thing
  // you came for, and leaving it open made the card read as an unfinished setup.
  // A failed run opens it, because then it IS the thing you came for.
  const [openedByUser, setOpenedByUser] = useState<boolean | null>(null)
  const showForm = hosted ? (openedByUser ?? failed) : true

  const mark = (k: string) => setTouched(prev => (prev[k] ? prev : { ...prev, [k]: true }))

  // Derived during render, never copied into state.
  const clientIdValue    = touched.clientId    ? clientId    : (env?.clientId    ?? '')
  const databaseUrlValue = touched.databaseUrl ? databaseUrl : (env?.databaseUrl ?? '')
  const portalValue      = touched.portal      ? portal      : (env?.publicPortal ?? false)

  async function submit(archive?: 'restore' | 'discard') {
    setBusy(true)
    setError(null)
    try {
      const endpoint = hosted ? 'env' : 'provision'
      const res = await fetch(`/api/bot-hosting/${endpoint}?guildId=${encodeURIComponent(guildId)}`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({
          token, clientId: clientIdValue, clientSecret,
          databaseUrl: databaseUrlValue, publicPortal: portalValue,
          ...(archive ? { archive } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))

      // A safety net rather than the normal path: the question is asked up front
      // from status.archives. Reaching this means an archive appeared between
      // loading the page and submitting.
      if (res.status === 409 && data?.error === 'archive_choice_required') {
        setArchiveChoice(null)
        onDone()
        return
      }

      if (!res.ok) throw new Error(String(data?.error ?? 'generic'))
      setToken(''); setClientSecret('')
      onDone()
    } catch (err) {
      setError(errorText(t, err instanceof Error ? err.message : null))
    } finally {
      setBusy(false)
    }
  }

  const complete = hosted
    ? true                                  // secrets may stay empty to keep them
    : !!(token && clientIdValue && clientSecret)

  return (
    <>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <Server className="h-4 w-4" /> {hosted ? t.host_edit_title : t.host_title}
        </h2>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          {hosted ? t.host_edit_desc : t.host_intro}
        </p>

        {hosted && !failed && (
          <button onClick={() => setOpenedByUser(!showForm)}
                  aria-expanded={showForm}
                  className="tap-target flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]">
            <ChevronDown className={`h-4 w-4 transition-transform ${showForm ? 'rotate-180' : ''}`} />
            {showForm ? t.host_edit_hide : t.host_edit_show}
          </button>
        )}

        {undecided && archive && (
          <ArchiveChoice archive={archive} t={t} busy={busy}
                         onRestore={() => submit('restore')}
                         onDiscard={() => setArchiveChoice('discard')} />
        )}

        {!hosted && !undecided && (
          <ol className="mb-5 space-y-2 text-sm text-[var(--color-muted-foreground)]">
            {[t.host_step1, t.host_step2, t.host_step3, t.host_step4].map((line, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        )}

        {failed && (
          <div role="alert" className="mb-5 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" /> {t.host_failed_title}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {errorText(t, status?.job?.error ?? null)} {t.host_failed_hint}
            </p>
            {status?.job?.log && (
              <>
                <p className="mt-3 mb-1 text-xs font-semibold">{t.host_log_title}</p>
                <pre className="max-h-64 overflow-auto rounded-lg bg-[var(--color-console)] p-3 font-mono text-[11px] leading-relaxed text-[var(--color-log-text)]">
                  {status.job.log}
                </pre>
              </>
            )}
          </div>
        )}

        {showForm && (
        <>
        <div className="mt-4 space-y-4">
          <Field label={t.host_token} hint={t.host_token_hint} type="password" required={!hosted}
                 value={token} onChange={setToken}
                 placeholder={hosted && env?.tokenSet ? t.host_secret_set : undefined} />
          <Field label={t.host_client_id} hint={t.host_client_id_hint} required={!hosted}
                 value={clientIdValue} onChange={v => { mark('clientId'); setClientId(v) }} />
          <Field label={t.host_client_secret} hint={t.host_client_secret_hint} type="password" required={!hosted}
                 value={clientSecret} onChange={setClientSecret}
                 placeholder={hosted && env?.clientSecretSet ? t.host_secret_set : undefined} />
          <Field label={t.host_database} hint={t.host_database_hint}
                 value={databaseUrlValue} onChange={v => { mark('databaseUrl'); setDatabaseUrl(v) }} />

          <label className="flex items-start gap-3">
            <input type="checkbox" checked={portalValue} className="mt-1 h-4 w-4 shrink-0"
                   onChange={e => { mark('portal'); setPortal(e.target.checked) }} />
            <span>
              <span className="block text-sm font-medium">{t.host_portal}</span>
              <span className="block text-xs text-[var(--color-muted-foreground)]">{t.host_portal_hint}</span>
            </span>
          </label>
        </div>

        {!hosted && (
          <p className="mt-4 flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t.host_after}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => submit(archiveChoice ?? undefined)}
                  disabled={busy || !complete || undecided} className="tap-target">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
            {busy ? t.host_activating : hosted ? t.host_save_restart : t.host_activate}
          </Button>
          {/* Only while setting up. Once installed the portal link already sits
              in the address card above, next to the redirect URI it belongs to. */}
          {!hosted && (
            <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="tap-target">
                <ExternalLink className="h-4 w-4" /> {t.botdash_redirect_open}
              </Button>
            </a>
          )}
          {!complete && !hosted && (
            <span className="text-xs text-[var(--color-muted-foreground)]">{t.host_required}</span>
          )}
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
        </>
        )}
      </div>

      {hosted && <RemoveCard guildId={guildId} t={t} onDone={onDone} />}
    </>
  )
}

/**
 * Asked when hosting is switched on again while an archived installation is
 * still on disk.
 *
 * Deliberately a blocking question with no preselected answer. Both outcomes are
 * destructive in opposite directions — restoring resurrects data the customer
 * may have wanted gone, starting fresh destroys the ticket history they may have
 * come back for — and only they know which.
 */
function ArchiveChoice({
  archive, t, busy, onRestore, onDiscard,
}: {
  archive: BotArchive; t: T; busy: boolean
  onRestore: () => void; onDiscard: () => void
}) {
  // The date comes out of a directory name, so it may not parse. Showing the raw
  // stamp beats showing "Invalid Date".
  const parsed = new Date(archive.archivedAt)
  const date   = Number.isNaN(parsed.getTime())
    ? archive.archivedAt
    : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div role="alert" className="mb-5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[var(--color-warning)]">
        <Archive className="h-4 w-4 shrink-0" /> {t.host_archive_title}
      </p>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        {t.host_archive_desc.replace('{date}', date)}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Button onClick={onRestore} disabled={busy} className="tap-target w-full">
            <RotateCcw className="h-4 w-4" /> {t.host_archive_restore}
          </Button>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.host_archive_restore_hint}</p>
        </div>
        <div className="flex-1">
          <Button variant="ghost" onClick={onDiscard} disabled={busy}
                  className="tap-target w-full text-[var(--color-danger)]">
            <Trash2 className="h-4 w-4" /> {t.host_archive_new}
          </Button>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.host_archive_new_hint}</p>
        </div>
      </div>

    </div>
  )
}

/** Removing hosting again. Typing the server id is the confirmation: this stops
 *  a running bot and takes its public address offline, and an accidental click
 *  is not something an undo could fix within the same minute. */
function RemoveCard({ guildId, t, onDone }: { guildId: string; t: T; onDone: () => void }) {
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/bot-hosting/deactivate?guildId=${encodeURIComponent(guildId)}`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ confirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(String(data?.error ?? 'generic'))
      onDone()
    } catch (err) {
      setError(errorText(t, err instanceof Error ? err.message : null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-card)] p-5">
      <h2 className="mb-1 text-base font-semibold text-[var(--color-danger)]">{t.host_remove_title}</h2>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t.host_remove_desc}</p>

      <label className="block max-w-sm">
        <span className="mb-1 block text-xs text-[var(--color-muted-foreground)]">{t.host_remove_confirm}</span>
        <Input value={confirm} onChange={e => setConfirm(e.target.value)}
               placeholder={guildId} autoComplete="off" spellCheck={false} />
      </label>

      <Button variant="ghost" onClick={remove} disabled={busy || confirm !== guildId}
              className="tap-target mt-4 text-[var(--color-danger)]">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {busy ? t.host_remove_busy : t.host_remove}
      </Button>

      {error && <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}
