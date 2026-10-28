'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { FormField, FormSection } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { useLang } from '@/components/i18n/LangProvider'
import { LocaleLink as Link } from '@/components/i18n/LocaleLink'
import { ArrowCounterClockwise, CircleNotch, FloppyDisk, Play } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { giveawayDetailHref, giveawayHref } from '@/lib/dashboardNav'
import { createGiveaway, editGiveaway } from './giveawayApi'
import {
  applyTemplate, createBody, draftOf, editBody, fieldOfError, newDraft, splitPrizes, validateDraft,
  type DraftField, type Giveaway, type GiveawayDraft, type Role,
} from './giveawayModel'
import { useGiveawayCopy, useGiveawayData, type GiveawayCopy } from './GiveawayProvider'
import {
  BonusEditor, ChannelSelect, DrawModeField, DurationField, MultiPicker, PrizeFields, Textarea, WIDTH, roleCopy, roleItems,
} from './formParts'
import { errorText, useBusy } from './useGiveawayAction'

export type FieldErrors = Partial<Record<DraftField, string>>

/** The words for a field the form itself found wrong. */
export function draftErrorText(t: GiveawayCopy, field: DraftField): string {
  switch (field) {
    case 'channel':         return t.e_channel_choose
    case 'title':           return t.e_title
    case 'description':     return t.e_description
    case 'winners':         return t.e_winners
    case 'duration':        return t.e_duration
    case 'couponPercent':   return t.e_percent
    case 'couponValidDays': return t.e_valid_days
    case 'name':            return t.tpl_err_name
    default:                return t.form_check
  }
}

/** Moves the focus to the first field marked invalid, once React has drawn the marks. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  setTimeout(() => form?.querySelector<HTMLElement>('[aria-invalid="true"] input, [aria-invalid="true"], input[aria-invalid="true"]')?.focus(), 0)
}

/**
 * Prizes, number of winners and how they are found: the same fields for a
 * giveaway and a template. A template that entered prizes differently than
 * the giveaway created from it would be a second notion of what a prize is.
 */
export function PrizeSection({ draft, update, errors, editing = false }: {
  draft: GiveawayDraft; update: (p: Partial<GiveawayDraft>) => void; errors: FieldErrors; editing?: boolean
}) {
  const { t } = useGiveawayCopy()
  return (
    <FormSection title={t.sec_prizes} description={t.sec_prizes_desc}>
      <PrizeFields
        prizes={draft.prizes} setPrizes={v => update({ prizes: v })}
        mode={draft.prizeMode} setMode={v => update({ prizeMode: v })}
        winners={draft.winnersCount} setWinners={v => update({ winnersCount: v })}
        errors={{ prizes: errors.prizes, winners: errors.winners }}
      />
      <DrawModeField mode={draft.winnerMode} setMode={v => update({ winnerMode: v })} editing={editing} error={errors.drawMode} />
    </FormSection>
  )
}

/**
 * Conditions for a single giveaway, or a template with its own.
 *
 * They REPLACE the server-wide settings, each field on its own. That is why
 * the fields start with exactly those settings: touching nothing changes
 * nothing, and whoever removes a server-wide role lifts it here on purpose.
 */
export function ConditionFields({ roles, draft, update }: {
  roles: Role[]; draft: GiveawayDraft; update: (p: Partial<GiveawayDraft>) => void
}) {
  const { t } = useGiveawayCopy()
  return (
    <>
      <MultiPicker
        legend={t.s_blacklist} hint={t.s_blacklist_hint}
        items={roleItems(roles)} value={draft.blacklist} onChange={v => update({ blacklist: v })}
        copy={roleCopy(t)} emptyLabel={t.pick_none_excluded}
      />
      <MultiPicker
        legend={t.s_whitelist} hint={t.s_whitelist_hint}
        items={roleItems(roles)} value={draft.whitelist} onChange={v => update({ whitelist: v })}
        copy={roleCopy(t)} emptyLabel={t.pick_none_required}
      />
      <BonusEditor roles={roles} value={draft.bonus} onChange={v => update({ bonus: v })} />
    </>
  )
}

/**
 * Create a giveaway, or change a running one (plan 6.5): one form in
 * sections, errors at their field, and nothing sent while one is open.
 *
 * The requests are the ones the old form sent (giveawayApi.ts); only what
 * may go out is checked before, by the bot's own rules (giveawayModel.ts).
 */
export function GiveawayForm({ giveaway, initialTemplate }: {
  /** The giveaway to change; a new one without. */
  giveaway?: Giveaway
  /** Id of a template to start from, from the template list. */
  initialTemplate?: string
}) {
  const { t } = useGiveawayCopy()
  const { localize, path } = useLang()
  const router = useRouter()
  const d = useGiveawayData()
  const editing = Boolean(giveaway)
  const formRef = useRef<HTMLFormElement>(null)
  const { busy, run } = useBusy()

  const [fromTemplate, setFromTemplate] = useState(() =>
    !editing && initialTemplate && d.templates.some(x => String(x.id) === initialTemplate) ? initialTemplate : '')
  const [draft, setDraft] = useState<GiveawayDraft>(() => {
    if (giveaway) return draftOf(giveaway, d.settings)
    const tpl = d.templates.find(x => String(x.id) === initialTemplate)
    return tpl ? applyTemplate(newDraft(d.settings), tpl, d.settings) : newDraft(d.settings)
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const update = (patch: Partial<GiveawayDraft>) => setDraft(x => ({ ...x, ...patch }))
  const prizeList = splitPrizes(draft.prizes)
  const perWinner = draft.prizeMode === 'INDIVIDUAL' && prizeList.length > 0
  const couponReady = Boolean(d.tebex?.configured)

  function pickTemplate(id: string) {
    setFromTemplate(id)
    const tpl = d.templates.find(x => String(x.id) === id)
    if (tpl) setDraft(x => applyTemplate(x, tpl, d.settings))
  }

  function resetConditions() {
    update({ blacklist: d.settings?.blacklist ?? [], whitelist: d.settings?.whitelist ?? [], bonus: d.settings?.bonusRoles ?? {} })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const found = validateDraft(draft, editing ? 'edit' : 'create')
    if (Object.keys(found).length > 0) {
      setErrors(Object.fromEntries(Object.keys(found).map(f => [f, draftErrorText(t, f as DraftField)])))
      setFormError(t.form_check)
      focusFirstInvalid(formRef.current)
      return
    }
    setErrors({})
    setFormError(null)
    const res = await run('save', () => giveaway ? editGiveaway(giveaway.id, editBody(draft)) : createGiveaway(createBody(draft)))
    if (!res.ok) {
      const field = fieldOfError(res.data.error)
      const text = errorText(t, res)
      if (field === 'form' || (field === 'channel' && editing)) { setFormError(text); return }
      setErrors({ [field]: text })
      setFormError(t.form_check)
      focusFirstInvalid(formRef.current)
      return
    }
    await d.reloadGiveaways()
    if (giveaway) {
      d.setFlash({ tone: 'success', text: t.done_edit, path })
      return
    }
    const id = (res.data as { id?: string }).id
    const target = id ? giveawayDetailHref(id) : giveawayHref('giveaways')
    d.setFlash({ tone: 'success', text: t.done_create, path: target })
    router.push(localize(target))
  }

  const perPrizeLabel = (i: number) => `${i + 1}. ${prizeList[i]}`
  const packageItems = d.packages.map(p => ({ id: p.id, label: p.name }))
  const packageCopy = { search: t.pick_search_packages, chosen: t.pick_chosen, none: t.pick_none, noMatch: t.pick_no_match, empty: t.pick_no_packages, remove: t.pick_remove }

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="grid max-w-[72rem]">
      {editing && <p className="mb-6 max-w-[65ch] text-[var(--color-muted-foreground)]">{t.edit_intro}</p>}

      <FormSection title={t.sec_message} description={editing ? t.sec_message_desc_edit : t.sec_message_desc}>
        {!editing && d.templates.length > 0 && (
          <FormField label={t.tpl_use} hint={fromTemplate ? t.tpl_applied : t.tpl_use_hint}>
            {field => (
              <Select {...field} value={fromTemplate} onChange={e => pickTemplate(e.target.value)} className={WIDTH.select}>
                <option value="">{t.tpl_use_none}</option>
                {d.templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name} · {tpl.title}</option>)}
              </Select>
            )}
          </FormField>
        )}
        {!editing && (
          <ChannelSelect
            label={t.f_channel} hint={t.f_channel_hint} channels={d.channels}
            value={draft.channelId} onChange={v => update({ channelId: v })}
            placeholder={t.f_channel_choose} error={errors.channel} required
          />
        )}
        <FormField label={t.f_title} error={errors.title} required>
          {field => <Input {...field} value={draft.title} maxLength={256} onChange={e => update({ title: e.target.value })} className={WIDTH.text} />}
        </FormField>
        <FormField label={t.f_description} hint={t.f_description_hint} error={errors.description} required>
          {field => <Textarea {...field} value={draft.description} maxLength={2000} rows={4} onChange={e => update({ description: e.target.value })} />}
        </FormField>
      </FormSection>

      <PrizeSection draft={draft} update={update} errors={errors} editing={editing} />

      {!editing && (
        <FormSection title={t.sec_duration} description={draft.winnerMode === 'FIRST_CLICK' ? t.sec_duration_desc_fast : t.sec_duration_desc}>
          <DurationField label={t.f_duration} value={draft.duration} onChange={v => update({ duration: v })} error={errors.duration} />
        </FormSection>
      )}

      <FormSection title={t.c_section} description={t.c_hint}>
        {couponReady ? (
          <>
            <div className="flex flex-wrap gap-x-8 gap-y-5">
              <FormField label={t.c_percent} hint={t.c_percent_hint} error={errors.couponPercent}>
                {field => (
                  <div className="flex items-center gap-3">
                    <Input {...field} type="number" min={1} max={100} inputMode="numeric" value={draft.couponPercent}
                      onChange={e => update({ couponPercent: e.target.value })} className={WIDTH.number} />
                    <span aria-hidden className="text-[var(--color-muted-foreground)]">%</span>
                  </div>
                )}
              </FormField>
              <FormField label={t.c_valid_days} hint={t.c_valid_hint} error={errors.couponValidDays}>
                {field => (
                  <div className="flex items-center gap-3">
                    <Input {...field} type="number" min={1} max={3650} inputMode="numeric" value={draft.couponValidDays}
                      onChange={e => update({ couponValidDays: e.target.value })} className={WIDTH.number} />
                    <span className="text-[var(--color-muted-foreground)]">{t.unit_days}</span>
                  </div>
                )}
              </FormField>
            </div>
            {d.packages.length > 0 && (
              <MultiPicker
                legend={perWinner ? t.c_packages_all : t.c_packages} hint={t.c_packages_hint}
                items={packageItems} value={draft.couponPackages} onChange={v => update({ couponPackages: v })}
                copy={packageCopy} emptyLabel={t.c_all_packages}
              />
            )}
            {d.packages.length > 0 && perWinner && prizeList.map((_, i) => (
              <MultiPicker
                key={i}
                legend={`${t.c_per_prize}: ${perPrizeLabel(i)}`} hint={i === 0 ? t.c_per_prize_hint : undefined}
                items={packageItems}
                value={draft.couponPackagesPerPrize[i] ?? []}
                onChange={v => {
                  const next = Array.from({ length: prizeList.length }, (_, k) => draft.couponPackagesPerPrize[k] ?? [])
                  next[i] = v
                  update({ couponPackagesPerPrize: next })
                }}
                copy={packageCopy} emptyLabel={t.c_per_prize_same}
              />
            ))}
            {errors.couponPackages && <Notice tone="danger">{errors.couponPackages}</Notice>}
          </>
        ) : d.owner ? (
          <Notice
            tone="info"
            action={<Button asChild variant="outline"><Link href={giveawayHref('store')} prefetch={false}>{t.c_to_store}</Link></Button>}
          >
            {t.c_needs_store}
          </Notice>
        ) : (
          <p className="max-w-[65ch] text-[var(--color-muted-foreground)]">{t.c_owner_only}</p>
        )}
      </FormSection>

      {/* Fixed codes of a THIRD-PARTY shop. Deliberately outside the store
          check: a joint giveaway with another developer needs no store of
          its own, the bot only delivers the code. */}
      <FormSection title={t.c_manual_section} description={t.c_manual_hint}>
        <FormField label={t.c_manual_code} error={errors.manualCode}>
          {field => <Input {...field} value={draft.manualCode} maxLength={128} autoComplete="off" onChange={e => update({ manualCode: e.target.value })} className={WIDTH.text} />}
        </FormField>
        {perWinner && prizeList.map((_, i) => (
          <FormField key={i} label={`${t.c_manual_per}: ${perPrizeLabel(i)}`}>
            {field => (
              <Input
                {...field} value={draft.manualPerPrize[i] ?? ''} maxLength={128} autoComplete="off"
                onChange={e => {
                  const next = Array.from({ length: prizeList.length }, (_, k) => draft.manualPerPrize[k] ?? '')
                  next[i] = e.target.value
                  update({ manualPerPrize: next })
                }}
                className={WIDTH.text}
              />
            )}
          </FormField>
        ))}
        <FormField label={t.c_manual_note}>
          {field => <Input {...field} value={draft.manualNote} maxLength={500} onChange={e => update({ manualNote: e.target.value })} className={WIDTH.text} />}
        </FormField>
      </FormSection>

      <FormSection title={t.elig_title} description={t.elig_hint}>
        <ConditionFields roles={d.roles} draft={draft} update={update} />
        <div>
          <Button type="button" variant="outline" onClick={resetConditions}>
            <ArrowCounterClockwise className="h-4 w-4" />
            {t.elig_reset}
          </Button>
        </div>
      </FormSection>

      <div className="grid gap-4 border-t border-[var(--color-border)] pt-6">
        {formError && <Notice tone="danger" role="alert">{formError}</Notice>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy !== null} aria-busy={busy !== null || undefined}>
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" /> : editing ? <FloppyDisk className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {editing ? t.btn_save_changes : t.btn_start}
          </Button>
          {!editing && (
            <Button asChild variant="outline">
              <Link href={giveawayHref('giveaways')} prefetch={false}>{t.back_to_list}</Link>
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
