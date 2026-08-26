'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Loader2, Upload, CheckCircle2, Clock, XCircle, LogOut, ShieldCheck, ImagePlus,
} from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { useJsonResource } from '@/lib/useAdminResource'
import { imageUploadTranslations } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { LocaleLink } from '@/components/i18n/LocaleLink'

interface UploadRow {
  id:           string
  category:     string
  name:         string
  label:        string | null
  status:       'pending' | 'approved' | 'rejected'
  rejectReason: string | null
  createdAt:    string
}

interface FormState {
  signedIn:    boolean
  displayName?: string | null
  categories:  Array<{ slug: string; name: string }>
  limits:      { maxBytes: number; perDay: number; usedToday?: number }
  mine?:       UploadRow[]
}

/**
 * Die Texte einer Sprache, mit auf `string` verbreiterten Literaltypen.
 *
 * `as const` in lib/i18n.ts macht aus jedem Wert seinen eigenen Literaltyp,
 * damit waere der deutsche Block nicht dem englischen zuweisbar und eine
 * Hilfsfunktion koennte nur eine der beiden Sprachen annehmen.
 */
type UploadCopy = (typeof imageUploadTranslations)['en']
type T = {
  readonly [K in keyof UploadCopy]: UploadCopy[K] extends readonly string[] ? readonly string[] : string
}

/** Turn a machine-readable failure into the sentence for this language. */
function messageFor(t: T, code: string): string {
  const key = `err_${code}` as keyof T
  const value = t[key]
  return typeof value === 'string' ? value : t.err_generic
}

export default function UploadClient({ lang, initialError }: { lang: Lang; initialError?: string }) {
  const t = imageUploadTranslations[lang]

  const { data: state, error, reload } = useJsonResource<FormState>(
    `/api/images/upload?lang=${lang}`, 'state', t.err_generic,
  )

  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy]       = useState(false)
  const [failure, setFailure] = useState<string | null>(
    initialError ? messageFor(t, initialError) : null,
  )
  const [done, setDone]       = useState(false)

  // Nur Aufraeumen, kein setState: der Objekt-URL haelt sonst die Datei im
  // Speicher, solange der Tab offen ist.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    setPreview(file ? URL.createObjectURL(file) : null)
    setFailure(null)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy || !formRef.current) return

    const body = new FormData(formRef.current)
    // Ein nicht angehaktes Kontrollkaestchen taucht in FormData gar nicht auf.
    // Der Server verlangt ausdruecklich 'true', also wird das Feld hier
    // eindeutig gesetzt statt sich auf die Abwesenheit zu verlassen.
    body.set('license', body.get('license') ? 'true' : 'false')

    setBusy(true)
    setFailure(null)
    try {
      const r = await fetch('/api/images/upload', { method: 'POST', body })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(typeof d.error === 'string' ? d.error : 'generic')
      formRef.current.reset()
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setDone(true)
      await reload()
    } catch (err) {
      setFailure(messageFor(t, err instanceof Error ? err.message : 'generic'))
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/images/upload/logout', { method: 'POST' })
    } catch { /* leave even on network error */ }
    await reload()
  }

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8 max-w-3xl">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1 className="mb-3 mt-2 text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
        <p className="text-base leading-relaxed text-[var(--color-muted-foreground)]">{t.subtitle}</p>
      </header>

      {error && (
        <Card role="alert" className="mb-6 p-6 text-sm text-[var(--color-danger)]">{error}</Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {!state && !error && (
            <Card className="flex items-center gap-2 p-6 text-sm text-[var(--color-muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin" /> …
            </Card>
          )}

          {/* ── not signed in ── */}
          {state && !state.signedIn && (
            <Card className="p-6">
              <h2 className="text-lg font-bold tracking-tight">{t.signin_title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {t.signin_body}
              </p>
              {failure && (
                <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">{failure}</p>
              )}
              <Button asChild variant="discord" className="mt-5">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
                    Ziel ist ein Route-Handler, keine Seite: er antwortet mit
                    einer Umleitung zu Discord. `next/link` wuerde daraus eine
                    Client-Navigation machen und eine RSC-Nutzlast erwarten, die
                    es dort nie gibt. Kein LocaleLink aus demselben Grund, die
                    Adresse traegt kein Sprachpraefix. */}
                <a href="/api/images/upload/auth">{t.signin_button}</a>
              </Button>
            </Card>
          )}

          {/* ── the form ── */}
          {state?.signedIn && (
            <Card className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {t.signed_in_as.replace('{name}', state.displayName ?? '—')}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" /> {t.sign_out}
                </Button>
              </div>

              {done ? (
                <div className="py-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--color-primary)]">
                    <CheckCircle2 className="h-5 w-5" /> {t.success_title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{t.success_body}</p>
                  <Button className="mt-5" onClick={() => setDone(false)}>
                    <ImagePlus className="h-4 w-4" /> {t.another}
                  </Button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={submit} className="space-y-5">
                  <div>
                    <label htmlFor="up-category" className="text-sm font-medium">{t.form_category}</label>
                    <select
                      id="up-category"
                      name="category"
                      required
                      className="mt-1.5 h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 text-sm text-[var(--color-foreground)]"
                    >
                      {state.categories.map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="up-name" className="text-sm font-medium">{t.form_name}</label>
                    <Input id="up-name" name="name" required maxLength={128} className="mt-1.5" />
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.form_name_hint}</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="up-label" className="text-sm font-medium">{t.form_label}</label>
                      <Input id="up-label" name="label" maxLength={160} className="mt-1.5" />
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.form_label_hint}</p>
                    </div>
                    <div>
                      <label htmlFor="up-tags" className="text-sm font-medium">{t.form_tags}</label>
                      <Input id="up-tags" name="tags" maxLength={255} className="mt-1.5" />
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.form_tags_hint}</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="up-file" className="text-sm font-medium">{t.form_file}</label>
                    <input
                      id="up-file"
                      name="file"
                      type="file"
                      required
                      accept="image/png,image/webp,image/jpeg"
                      onChange={pickFile}
                      className="mt-1.5 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-primary-foreground)]"
                    />
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.form_file_hint}</p>
                    {preview && (
                      <div className="checker-bg mt-3 flex max-h-56 items-center justify-center overflow-hidden rounded-lg p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element --
                            Eine blob:-URL aus der lokalen Dateiauswahl. next/image
                            kann sie nicht optimieren und soll es auch nicht: die
                            Datei hat den Rechner noch gar nicht verlassen. */}
                        <img src={preview} alt="" className="max-h-52 object-contain" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="up-note" className="text-sm font-medium">{t.form_note}</label>
                    <textarea
                      id="up-note"
                      name="note"
                      maxLength={500}
                      rows={3}
                      className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-primary)]"
                    />
                    <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.form_note_hint}</p>
                  </div>

                  <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
                    <label className="flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="license"
                        value="true"
                        required
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                      />
                      <span>{t.license_label}</span>
                    </label>
                    <p className="mt-2 pl-7 text-xs text-[var(--color-muted-foreground)]">{t.license_hint}</p>
                  </div>

                  {failure && (
                    <p role="alert" className="text-sm text-[var(--color-danger)]">{failure}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    <Button type="submit" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {busy ? t.submitting : t.submit}
                    </Button>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {t.limit_line
                        .replace('{used}', String(state.limits.usedToday ?? 0))
                        .replace('{perDay}', String(state.limits.perDay))}
                    </span>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* ── own submissions ── */}
          {state?.signedIn && (
            <Card className="p-6">
              <h2 className="text-lg font-bold tracking-tight">{t.mine_title}</h2>
              {!state.mine?.length ? (
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{t.mine_empty}</p>
              ) : (
                <ul className="mt-4 divide-y divide-[var(--color-border)]">
                  {state.mine.map(u => (
                    <li key={u.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="font-mono text-sm">{u.name}</div>
                        <div className="text-xs text-[var(--color-muted-foreground)]">{u.category}</div>
                        {u.status === 'rejected' && u.rejectReason && (
                          <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                            {t.reason_label}: {u.rejectReason}
                          </div>
                        )}
                        {u.status === 'approved' && (
                          <LocaleLink
                            href={`/images/${u.category}/${u.name}`}
                            className="mt-1 inline-block text-xs text-[var(--color-primary)] hover:underline"
                          >
                            {t.view_in_gallery}
                          </LocaleLink>
                        )}
                      </div>
                      <StatusBadge t={t} status={u.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* ── rules ── */}
        <aside>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" /> {t.rules_title}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--color-muted-foreground)]">
              {t.rules_items.map(item => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-primary)]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-muted-foreground)]">
              {t.rules_note}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function StatusBadge({ t, status }: { t: T; status: UploadRow['status'] }) {
  const map = {
    pending:  { label: t.status_pending,  icon: Clock,        cls: 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]' },
    approved: { label: t.status_approved, icon: CheckCircle2, cls: 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
    rejected: { label: t.status_rejected, icon: XCircle,      cls: 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]' },
  }[status]
  const Icon = map.icon

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold', map.cls)}>
      <Icon className="h-3.5 w-3.5" /> {map.label}
    </span>
  )
}
