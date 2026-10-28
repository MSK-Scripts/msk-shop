'use client'

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { DataTable, type DataColumn } from '@/components/dashboard/DataTable'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField, FormSection } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RowMenu } from '@/components/dashboard/RowMenu'
import { useLang } from '@/components/i18n/LangProvider'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { CircleNotch, FloppyDisk, PencilSimple, Play, Plus, Trash } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GIVEAWAY_NEW_HREF, TEMPLATE_NEW_HREF, giveawayHref, templateHref } from '@/lib/dashboardNav'
import { formatNumber } from '@/lib/format'
import { giveawayDashboardTranslations, type Lang } from '@/lib/i18n'
import { deleteTemplate, saveTemplate } from './giveawayApi'
import {
  durationSeconds, fieldOfError, hasOwnConditions, templateBody, templateDraft, validateDraft,
  type DraftField, type GiveawayDraft, type Template,
} from './giveawayModel'
import { FlashNotice, useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { ConditionFields, PrizeSection, draftErrorText, focusFirstInvalid, type FieldErrors } from './GiveawayForm'
import { DurationField, FirstClickTag, Textarea, WIDTH } from './formParts'
import { errorText, useBusy } from './useGiveawayAction'

/** A stored duration for people: `1 day`, `23 hr 59 min`; the raw text if it does not parse. */
export function formatDurationText(text: string, lang: Lang): string {
  const seconds = durationSeconds(text)
  if (seconds === null) return text
  const locale = lang === 'de' ? 'de-DE' : 'en-US'
  const parts: string[] = []
  let rest = seconds
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]] as const) {
    const n = Math.floor(rest / size)
    rest -= n * size
    if (n > 0) parts.push(new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: unit === 'day' ? 'long' : 'short' }).format(n))
  }
  return parts.join(' ') || text
}

/** The columns of the template table, in the language of the page. */
export function templateColumns(lang: Lang): DataColumn<Template>[] {
  const t = giveawayDashboardTranslations[lang]
  return [
    {
      id: 'name',
      header: t.col_template,
      sortValue: tpl => tpl.name,
      className: 'min-w-[14rem]',
      cell: tpl => (
        <div className="grid gap-1">
          <Link href={templateHref(tpl.id)} prefetch={false} className="inline-flex min-h-9 items-center font-semibold text-[var(--color-primary)] hover:underline">
            {tpl.name}
          </Link>
          <span className="flex flex-wrap items-center gap-2 text-small text-[var(--color-muted-foreground)]">
            {tpl.title}
            {tpl.winnerMode === 'FIRST_CLICK' && <FirstClickTag />}
          </span>
        </div>
      ),
    },
    {
      id: 'duration',
      header: t.col_duration,
      nowrap: true,
      sortValue: tpl => durationSeconds(tpl.duration),
      cell: tpl => formatDurationText(tpl.duration, lang),
    },
    {
      id: 'winners',
      header: t.col_winners,
      numeric: true,
      nowrap: true,
      sortValue: tpl => tpl.winnersCount,
      cell: tpl => formatNumber(tpl.winnersCount, lang),
    },
    {
      id: 'conditions',
      header: t.col_conditions,
      cell: tpl => hasOwnConditions(tpl)
        ? <span className="font-semibold">{t.tpl_conditions_own}</span>
        : <span className="text-[var(--color-muted-foreground)]">{t.tpl_conditions_server}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">{t.col_actions}</span>,
      nowrap: true,
      cell: tpl => <TemplateActions template={tpl} />,
    },
  ]
}

/**
 * Per template: start a giveaway from it inline, edit and delete in the
 * menu. Deleting asks first: a deleted template is gone with all its text,
 * while the giveaways started from it keep running.
 */
export function TemplateActions({ template: tpl }: { template: Template }) {
  const { t } = useGiveawayCopy()
  const { path } = useLang()
  const d = useGiveawayData()
  const { busy, run } = useBusy()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    const res = await run('delete', () => deleteTemplate(tpl.id))
    if (!res.ok) { setError(errorText(t, res)); return }
    await d.reloadTemplates()
    setOpen(false)
    d.setFlash({ tone: 'success', text: t.done_template_deleted.replace('{name}', tpl.name), path })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`${GIVEAWAY_NEW_HREF}?template=${tpl.id}`} prefetch={false}>
          <Play className="h-4 w-4" />
          {t.tpl_start}
        </Link>
      </Button>
      <RowMenu
        label={t.act_more.replace('{title}', tpl.name)}
        items={[
          { id: 'edit', label: t.act_edit, icon: PencilSimple, href: templateHref(tpl.id) },
          { id: 'delete', label: t.tpl_delete, icon: Trash, danger: true, onSelect: () => { setError(null); setOpen(true) } },
        ]}
      />
      {/* The dialog sits in a table cell that does not wrap; its text must. */}
      <div className="contents whitespace-normal text-left">
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => void remove()}
          title={t.cf_tpl_delete_title.replace('{name}', tpl.name)}
          description={t.cf_tpl_delete_desc}
          confirmLabel={t.tpl_delete}
          cancelLabel={t.dlg_back}
          busy={busy === 'delete'}
          error={error}
        />
      </div>
    </div>
  )
}

/** The saved templates of the server, with the way to a new one. */
export function TemplatesArea() {
  const { t, lang } = useGiveawayCopy()
  const d = useGiveawayData()
  const columns = useMemo(() => templateColumns(lang), [lang])
  return (
    <div className="grid gap-[var(--app-gutter-y)]">
      <p className="max-w-[65ch] text-[var(--color-muted-foreground)]">{t.tpl_hint}</p>
      <DataTable
        caption={t.tpl_caption}
        captionHidden
        columns={columns}
        rows={d.templates}
        rowKey={tpl => String(tpl.id)}
        className="max-w-[72rem]"
        empty={
          <EmptyState
            kind="first-use"
            title={t.tpl_empty_title}
            action={<Button asChild><Link href={TEMPLATE_NEW_HREF} prefetch={false}><Plus className="h-4 w-4" />{t.tpl_new}</Link></Button>}
          >
            {t.tpl_empty_body}
          </EmptyState>
        }
      />
    </div>
  )
}

/**
 * A new template, or a change to one (plan 6.5): the same sections as a
 * giveaway, without channel and coupons, which belong to a single giveaway.
 */
export function TemplateEditor({ id }: { id?: string }) {
  const { t } = useGiveawayCopy()
  const { localize } = useLang()
  const router = useRouter()
  const d = useGiveawayData()
  const tpl = id ? d.templates.find(x => String(x.id) === id) : undefined
  const back = { href: giveawayHref('templates'), label: t.back_to_templates }

  if (id && !tpl) {
    return (
      <>
        <PageHeader title={t.tpl_missing_title} back={back} />
        <EmptyState
          kind="unavailable" headingLevel="h2" title={t.tpl_missing_title}
          action={<Button asChild variant="outline"><Link href={giveawayHref('templates')} prefetch={false}>{t.back_to_templates}</Link></Button>}
        >
          {t.tpl_missing_body}
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader title={tpl ? tpl.name : t.tpl_new} description={tpl ? t.tpl_edit_lead : t.tpl_new_lead} back={back} />
      <FlashNotice />
      <TemplateForm
        key={tpl?.id ?? 'new'}
        template={tpl}
        onSaved={() => {
          d.setFlash({ tone: 'success', text: t.done_template_saved, path: giveawayHref('templates') })
          router.push(localize(giveawayHref('templates')))
        }}
      />
    </>
  )
}

function TemplateForm({ template, onSaved }: { template?: Template; onSaved: () => void }) {
  const { t } = useGiveawayCopy()
  const d = useGiveawayData()
  const formRef = useRef<HTMLFormElement>(null)
  const { busy, run } = useBusy()
  const initial = useMemo(() => templateDraft(template, d.settings), [template, d.settings])
  const [name, setName] = useState(initial.name)
  const [own, setOwn] = useState(initial.own)
  const [draft, setDraft] = useState<GiveawayDraft>(initial.draft)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const update = (patch: Partial<GiveawayDraft>) => setDraft(x => ({ ...x, ...patch }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found: Partial<Record<DraftField, true>> = validateDraft(draft, 'template')
    if (!name.trim()) found.name = true
    if (Object.keys(found).length > 0) {
      setErrors(Object.fromEntries(Object.keys(found).map(f => [f, draftErrorText(t, f as DraftField)])))
      setFormError(t.form_check)
      focusFirstInvalid(formRef.current)
      return
    }
    setErrors({})
    setFormError(null)
    const res = await run('save', () => saveTemplate(templateBody(name, draft, own), template?.id))
    if (!res.ok) {
      const field = fieldOfError(res.data.error)
      const text = errorText(t, res)
      if (field === 'form') { setFormError(text); return }
      setErrors({ [field]: text })
      setFormError(t.form_check)
      focusFirstInvalid(formRef.current)
      return
    }
    await d.reloadTemplates()
    onSaved()
  }

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="grid max-w-[72rem]">
      <FormSection title={t.sec_template} description={t.sec_template_desc}>
        <FormField label={t.tpl_name} hint={t.tpl_name_hint} error={errors.name} required>
          {field => <Input {...field} value={name} maxLength={64} onChange={e => setName(e.target.value)} className={WIDTH.short} />}
        </FormField>
        <FormField label={t.f_title} error={errors.title} required>
          {field => <Input {...field} value={draft.title} maxLength={256} onChange={e => update({ title: e.target.value })} className={WIDTH.text} />}
        </FormField>
        <FormField label={t.f_description} hint={t.f_description_hint} error={errors.description} required>
          {field => <Textarea {...field} value={draft.description} maxLength={2000} rows={4} onChange={e => update({ description: e.target.value })} />}
        </FormField>
      </FormSection>

      <PrizeSection draft={draft} update={update} errors={errors} />

      <FormSection title={t.sec_duration} description={t.sec_duration_desc_tpl}>
        <DurationField label={t.f_duration} value={draft.duration} onChange={v => update({ duration: v })} error={errors.duration} />
      </FormSection>

      <FormSection title={t.elig_title} description={t.tpl_own_hint}>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
          <input type="checkbox" checked={own} onChange={e => setOwn(e.target.checked)} className="h-5 w-5 accent-[var(--color-primary)]" />
          {t.tpl_own_conditions}
        </label>
        {own && <ConditionFields roles={d.roles} draft={draft} update={update} />}
      </FormSection>

      <div className="grid gap-4 border-t border-[var(--color-border)] pt-6">
        {formError && <Notice tone="danger" role="alert">{formError}</Notice>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy !== null} aria-busy={busy !== null || undefined}>
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
            {t.tpl_save}
          </Button>
          <Button asChild variant="outline">
            <Link href={giveawayHref('templates')} prefetch={false}>{t.back_to_templates}</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
