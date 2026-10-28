'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog'
import { FormField } from '@/components/dashboard/FormField'
import { Notice } from '@/components/dashboard/Notice'
import { RowMenu, type RowMenuItem } from '@/components/dashboard/RowMenu'
import { useLang } from '@/components/i18n/LangProvider'
import {
  ArrowSquareOut, CircleNotch, Clock, DiceFive, Layout, Pause, PencilSimple, Play, Prohibit, Stop, Trash,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { giveawayDetailHref, giveawayHref } from '@/lib/dashboardNav'
import { formatNumber } from '@/lib/format'
import {
  changeGiveaway, deleteGiveaway, extendGiveaway, rerollGiveaway, saveGiveawayAsTemplate, type ActionResult, type Lifecycle,
} from './giveawayApi'
import { canDelete, durationText, durationValid, winnerLabel as nameOf, type DurationInput, type Giveaway } from './giveawayModel'
import { useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import { DurationField } from './formParts'
import { errorText, useBusy } from './useGiveawayAction'

type DialogKind = 'end' | 'cancel' | 'rerollAll' | 'rerollOne' | 'extend' | 'template' | 'delete'

/**
 * What a deletion needs to know first, from the bot's answer for this one
 * giveaway (`/giveaway`): how many coupon codes were handed out. Only a bot
 * of the scheduling release sends it, and only then is deleting offered.
 */
export interface DeletionInfo { couponsIssued: number }

/**
 * What can be done with one giveaway, by its state (plan 6.5): at most one
 * action inline, the rest in the overflow menu. The bot accepts end, cancel,
 * pause and extend only while a giveaway runs, resume only while it is
 * paused and reroll only once it has ended; nothing else is offered. A
 * scheduled one has no message yet: it can be changed and cancelled, and
 * none of the actions of a running giveaway apply.
 *
 * Deleting is offered for an ended, cancelled or scheduled giveaway, and only
 * with `deletion`: the number of coupon codes the dialog has to warn about.
 *
 * Ending, cancelling and drawing again ask first, with buttons that name
 * the consequence. Pausing and resuming do not: both can be undone with one
 * click, and a question there would only teach people to click through.
 *
 * `row` sits in a table row (36 px buttons are allowed there), `header` in
 * the head of the giveaway's own page.
 */
export function GiveawayActions({ giveaway: g, variant, deletion }: {
  giveaway: Giveaway
  variant: 'row' | 'header'
  deletion?: DeletionInfo
}) {
  const { t, lang } = useGiveawayCopy()
  const { path, localize } = useLang()
  const router = useRouter()
  const d = useGiveawayData()
  const { busy, run } = useBusy()
  const [open, setOpen] = useState<DialogKind | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [extendBy, setExtendBy] = useState<DurationInput>({ amount: '1', unit: 'h' })
  const [extendInvalid, setExtendInvalid] = useState(false)
  const [winnerId, setWinnerId] = useState(g.winnerIds?.[0] ?? '')
  const [templateName, setTemplateName] = useState(g.title)

  const size = variant === 'row' ? 'sm' : 'md'
  const title = (text: string) => text.replace('{title}', g.title)
  const show = (kind: DialogKind) => { setDialogError(null); setOpen(kind) }
  const close = () => { setOpen(null); setDialogError(null) }

  /**
   * Sends one change and reloads the list either way, as the old dashboard
   * did: a refusal often means the giveaway changed in Discord meanwhile.
   */
  async function act(key: string, request: () => Promise<ActionResult>, done: string) {
    const res = await run(key, request)
    await d.reloadGiveaways()
    if (!res.ok) {
      if (open) setDialogError(errorText(t, res))
      else d.setFlash({ tone: 'danger', text: errorText(t, res), path })
      return
    }
    close()
    d.setFlash({ tone: 'success', text: done.replace('{title}', g.title), path })
  }

  const lifecycle = (action: Lifecycle, done: string) => act(action, () => changeGiveaway(action, g.id), done)

  async function saveTemplate() {
    const res = await run('template', () => saveGiveawayAsTemplate(g.id, templateName, g.title))
    if (!res.ok) { setDialogError(errorText(t, res)); return }
    await d.reloadTemplates()
    close()
    d.setFlash({
      tone: 'success', path,
      text: t.done_template.replace('{name}', templateName.trim() || g.title),
      link: { href: giveawayHref('templates'), label: t.to_templates },
    })
  }

  /**
   * Deletes after the confirmation. The route removes the public result page
   * once the bot confirmed; the list is where the visitor lands, since the
   * page of this giveaway is gone.
   */
  async function remove() {
    const res = await run('delete', () => deleteGiveaway(g.id))
    if (!res.ok) {
      setDialogError(errorText(t, res))
      await d.reloadGiveaways()
      return
    }
    close()
    const list = giveawayHref('giveaways')
    const pageLeft = res.data.resultPage === 'failed'
    d.setFlash({ tone: pageLeft ? 'warning' : 'success', text: (pageLeft ? t.done_delete_page : t.done_delete).replace('{title}', g.title), path: list })
    router.push(localize(list))
    await d.reloadGiveaways()
  }

  function extend() {
    if (!durationValid(extendBy)) { setExtendInvalid(true); return }
    setExtendInvalid(false)
    void act('extend', () => extendGiveaway(g.id, durationText(extendBy)), t.done_extend)
  }

  // ── What is offered, by state ──────────────────────────────────────────────
  const menu: RowMenuItem[] = []
  let inline: ReactNode = null
  const spinner = (key: string) => busy === key ? <CircleNotch className="h-4 w-4 animate-spin" /> : null

  if (g.status === 'ACTIVE') {
    inline = (
      <Button variant="outline" size={size} onClick={() => show('end')} disabled={busy !== null}>
        <Stop className="h-4 w-4" />
        {t.act_end}
      </Button>
    )
    if (variant === 'row') menu.push({ id: 'edit', label: t.act_edit, icon: PencilSimple, href: giveawayDetailHref(g.id) })
    menu.push(
      { id: 'pause', label: t.act_pause, icon: Pause, onSelect: () => void lifecycle('pause', t.done_pause), disabled: busy !== null },
      { id: 'extend', label: t.act_extend, icon: Clock, onSelect: () => show('extend') },
      { id: 'cancel', label: t.act_cancel, icon: Prohibit, onSelect: () => show('cancel'), danger: true },
    )
  } else if (g.status === 'PAUSED') {
    inline = (
      <Button variant="outline" size={size} onClick={() => void lifecycle('resume', t.done_resume)} disabled={busy !== null} aria-busy={busy === 'resume' || undefined}>
        {spinner('resume') ?? <Play className="h-4 w-4" />}
        {t.act_resume}
      </Button>
    )
    if (variant === 'row') menu.push({ id: 'edit', label: t.act_edit, icon: PencilSimple, href: giveawayDetailHref(g.id) })
  } else if (g.status === 'SCHEDULED') {
    if (variant === 'row') menu.push({ id: 'edit', label: t.act_edit, icon: PencilSimple, href: giveawayDetailHref(g.id) })
    menu.push({ id: 'cancel', label: t.act_cancel, icon: Prohibit, onSelect: () => show('cancel'), danger: true })
  } else if (g.status === 'ENDED') {
    menu.push({ id: 'rerollAll', label: t.act_reroll_all, icon: DiceFive, onSelect: () => show('rerollAll'), danger: true })
    if ((g.winnerIds?.length ?? 0) > 0) {
      menu.push({ id: 'rerollOne', label: t.act_reroll_one, icon: DiceFive, onSelect: () => show('rerollOne'), danger: true })
    }
  }
  if (g.resultUrl) {
    if (g.status === 'ENDED' && !inline) {
      inline = (
        <Button asChild variant="outline" size={size}>
          <a href={g.resultUrl} target="_blank" rel="noopener noreferrer">
            <ArrowSquareOut className="h-4 w-4" />
            {t.act_results}
            <span className="sr-only">{t.opens_new_tab}</span>
          </a>
        </Button>
      )
    } else {
      menu.push({ id: 'results', label: t.act_results, icon: ArrowSquareOut, external: g.resultUrl })
    }
  }
  // Any state: a running giveaway may be saved too, to repeat it later.
  menu.push({ id: 'template', label: t.act_template, icon: Layout, onSelect: () => show('template') })
  const deletable = Boolean(deletion) && canDelete(g)
  if (deletable) menu.push({ id: 'delete', label: t.act_delete, icon: Trash, onSelect: () => show('delete'), danger: true })

  const coupons = deletion?.couponsIssued ?? 0

  // The stored name where there is one, the id beside it, so two winners of
  // the same name stay apart.
  const winnerLabel = (id: string) => {
    const w = g.winners?.find(x => x.userId === id)
    const prize = w && w.prizeIndex != null ? g.prizes[w.prizeIndex] : undefined
    const who = w?.displayName?.trim() ? `${nameOf(w)} (@${id})` : `@${id}`
    return prize ? `${who} (${prize})` : who
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {inline}
      <RowMenu label={title(t.act_more)} items={menu} size={size} />

      {/* The dialogs sit in a table cell that does not wrap; their text must. */}
      <div className="contents whitespace-normal text-left">
      {g.status === 'ACTIVE' && (
        <>
          <ConfirmDialog
            open={open === 'end'}
            onClose={close}
            onConfirm={() => void lifecycle('end', t.done_end)}
            title={title(t.cf_end_title)}
            description={g.winnerMode === 'FIRST_CLICK' ? t.cf_end_desc_fast : t.cf_end_desc}
            confirmLabel={t.act_end}
            cancelLabel={t.dlg_back}
            tone="primary"
            busy={busy === 'end'}
            error={dialogError}
          />
          <ConfirmDialog
            open={open === 'cancel'}
            onClose={close}
            onConfirm={() => void lifecycle('cancel', t.done_cancel)}
            title={title(t.cf_cancel_title)}
            description={t.cf_cancel_desc}
            confirmLabel={t.act_cancel}
            cancelLabel={t.cf_cancel_keep}
            busy={busy === 'cancel'}
            error={dialogError}
          />
          <Dialog
            open={open === 'extend'}
            onClose={close}
            title={title(t.dlg_extend_title)}
            description={t.dlg_extend_desc}
            body={
              <div className="grid gap-3">
                <DurationField
                  label={t.dlg_extend_by} value={extendBy} onChange={setExtendBy}
                  error={extendInvalid ? t.e_duration : undefined}
                />
                {dialogError && <p role="alert" className="text-small font-semibold text-[var(--color-danger)]">{dialogError}</p>}
              </div>
            }
          >
            <Button variant="outline" onClick={close} disabled={busy !== null}>{t.dlg_back}</Button>
            <Button onClick={extend} disabled={busy !== null} aria-busy={busy === 'extend' || undefined}>
              {spinner('extend') ?? <Clock className="h-4 w-4" />}
              {t.dlg_extend_confirm}
            </Button>
          </Dialog>
        </>
      )}

      {g.status === 'SCHEDULED' && (
        <ConfirmDialog
          open={open === 'cancel'}
          onClose={close}
          onConfirm={() => void lifecycle('cancel', t.done_cancel)}
          title={title(t.cf_cancel_title)}
          description={t.cf_cancel_desc_scheduled}
          confirmLabel={t.act_cancel}
          cancelLabel={t.cf_cancel_keep_scheduled}
          busy={busy === 'cancel'}
          error={dialogError}
        />
      )}

      {deletable && (
        <ConfirmDialog
          open={open === 'delete'}
          onClose={close}
          onConfirm={() => void remove()}
          title={title(t.cf_delete_title)}
          description={g.status === 'SCHEDULED' ? t.cf_delete_desc_scheduled : t.cf_delete_desc}
          notice={coupons > 0 && (
            <Notice tone="warning">
              {coupons === 1 ? t.cf_delete_coupons_one : t.cf_delete_coupons_n.replace('{n}', formatNumber(coupons, lang))}
            </Notice>
          )}
          confirmLabel={t.cf_delete_confirm}
          cancelLabel={t.cf_delete_keep}
          busy={busy === 'delete'}
          error={dialogError}
        />
      )}

      {g.status === 'ENDED' && (
        <>
          <ConfirmDialog
            open={open === 'rerollAll'}
            onClose={close}
            onConfirm={() => void act('rerollAll', () => rerollGiveaway(g.id), t.done_reroll)}
            title={title(t.cf_reroll_title)}
            description={t.cf_reroll_desc}
            confirmLabel={t.act_reroll_all}
            cancelLabel={t.dlg_back}
            busy={busy === 'rerollAll'}
            error={dialogError}
          />
          {(g.winnerIds?.length ?? 0) > 0 && (
            <Dialog
              open={open === 'rerollOne'}
              onClose={close}
              title={title(t.dlg_reroll_one_title)}
              description={t.dlg_reroll_one_desc}
              body={
                <div className="grid gap-3">
                  <FormField label={t.dlg_reroll_one_field}>
                    {field => (
                      <Select {...field} value={winnerId} onChange={e => setWinnerId(e.target.value)} className="font-mono">
                        {g.winnerIds!.map(id => <option key={id} value={id}>{winnerLabel(id)}</option>)}
                      </Select>
                    )}
                  </FormField>
                  {dialogError && <p role="alert" className="text-small font-semibold text-[var(--color-danger)]">{dialogError}</p>}
                </div>
              }
            >
              <Button variant="outline" onClick={close} disabled={busy !== null}>{t.dlg_back}</Button>
              <Button
                variant="danger"
                onClick={() => void act('rerollOne', () => rerollGiveaway(g.id, winnerId.trim()), t.done_reroll_one)}
                disabled={busy !== null || !winnerId.trim()}
                aria-busy={busy === 'rerollOne' || undefined}
              >
                {spinner('rerollOne') ?? <DiceFive className="h-4 w-4" />}
                {t.dlg_reroll_one_confirm}
              </Button>
            </Dialog>
          )}
        </>
      )}

      <Dialog
        open={open === 'template'}
        onClose={close}
        title={title(t.dlg_template_title)}
        description={t.dlg_template_desc}
        body={
          <div className="grid gap-3">
            <FormField label={t.tpl_name} hint={t.tpl_name_hint}>
              {field => <Input {...field} value={templateName} maxLength={64} onChange={e => setTemplateName(e.target.value)} />}
            </FormField>
            {dialogError && <p role="alert" className="text-small font-semibold text-[var(--color-danger)]">{dialogError}</p>}
          </div>
        }
      >
        <Button variant="outline" onClick={close} disabled={busy !== null}>{t.dlg_back}</Button>
        <Button onClick={() => void saveTemplate()} disabled={busy !== null} aria-busy={busy === 'template' || undefined}>
          {spinner('template') ?? <Layout className="h-4 w-4" />}
          {t.dlg_template_confirm}
        </Button>
      </Dialog>
      </div>
    </div>
  )
}
