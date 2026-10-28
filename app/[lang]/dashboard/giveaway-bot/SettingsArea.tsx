'use client'

import { useState } from 'react'

import { EmptyState } from '@/components/dashboard/EmptyState'
import { FormField, FormSection } from '@/components/dashboard/FormField'
import { SaveBar } from '@/components/dashboard/SaveBar'
import { useLang } from '@/components/i18n/LangProvider'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { saveSettings } from './giveawayApi'
import { BOT_LANGS, BUTTON_STYLES, HEX_COLOR, settingsBody, type Settings } from './giveawayModel'
import { FlashNotice, useGiveawayCopy, useGiveawayData } from './GiveawayProvider'
import {
  BonusEditor, ChannelSelect, MultiPicker, NumberWithUnit, RoleSelect, Textarea, WIDTH, roleCopy, roleItems,
} from './formParts'
import { errorText, useBusy } from './useGiveawayAction'

/** Names of the bot's languages, each in itself. */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', hu: 'Magyar', pl: 'Polski', pt: 'Português',
}

/** The label of the entry button per bot language (`giveaway.button` in its locales). */
const BUTTON_LABELS: Record<string, string> = {
  en: 'Join Giveaway', de: 'Teilnehmen', fr: 'Participer', es: 'Participar', hu: 'Csatlakozom', pl: 'Weź udział', pt: 'Participar',
}

/** Discord's own button colours, for the preview only. */
const BUTTON_COLORS: Record<string, { bg: string; fg: string }> = {
  PRIMARY:   { bg: '#5865f2', fg: '#ffffff' },
  SECONDARY: { bg: '#4e5058', fg: '#ffffff' },
  SUCCESS:   { bg: '#248046', fg: '#ffffff' },
  DANGER:    { bg: '#da373c', fg: '#ffffff' },
}

/**
 * The server-wide settings (plan 6.5) in sections with a save bar: general,
 * entry conditions, roles, notifications, the message to winners.
 *
 * One request saves all of it, the same body as before (`settingsBody`).
 * The colour is checked at its field before that, since the bot stores any
 * text there and falls back to its default colour in Discord.
 */
export function SettingsArea() {
  const { t } = useGiveawayCopy()
  const { path } = useLang()
  const d = useGiveawayData()
  const { busy, run } = useBusy()
  const [form, setForm] = useState<Settings | null>(d.settings)
  const [colorError, setColorError] = useState(false)

  // Discard local edits whenever a fresh settings object arrives from the
  // server. Adjusting during render instead of in an effect means React redoes
  // this render before committing, rather than painting the stale form first.
  const [lastSettings, setLastSettings] = useState(d.settings)
  if (lastSettings !== d.settings) {
    setLastSettings(d.settings)
    setForm(d.settings)
  }

  if (!form || !d.settings) {
    return <EmptyState kind="error" title={t.s_unavailable_title}>{t.s_unavailable}</EmptyState>
  }

  const saved = d.settings
  const dirty = JSON.stringify(settingsBody(form)) !== JSON.stringify(settingsBody(saved))
  const upd = (patch: Partial<Settings>) => setForm(f => (f ? { ...f, ...patch } : f))

  async function save() {
    if (!form) return
    if (form.embedColor !== saved.embedColor && !HEX_COLOR.test(form.embedColor)) { setColorError(true); return }
    setColorError(false)
    const res = await run('save', () => saveSettings(form))
    if (!res.ok) { d.setFlash({ tone: 'danger', text: errorText(t, res), path }); return }
    if (res.data.settings) d.setSettings(res.data.settings as Settings)
    d.setFlash({ tone: 'success', text: t.s_saved, path })
  }

  const style = BUTTON_COLORS[form.buttonStyle] ?? BUTTON_COLORS.PRIMARY
  const pickerColor = HEX_COLOR.test(form.embedColor) ? form.embedColor : '#000000'

  return (
    <div className="grid max-w-[72rem] gap-4">
      <FlashNotice />

      <FormSection title={t.s_sec_general} description={t.s_sec_general_desc}>
        <FormField label={t.s_language}>
          {field => (
            <Select {...field} value={form.lang} onChange={e => upd({ lang: e.target.value })} className={WIDTH.short}>
              {BOT_LANGS.map(l => <option key={l} value={l} lang={l}>{LANGUAGE_NAMES[l]}</option>)}
            </Select>
          )}
        </FormField>
        <FormField label={t.s_color} hint={t.s_color_hint} error={colorError ? t.e_color : undefined}>
          {field => (
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={pickerColor}
                onChange={e => upd({ embedColor: e.target.value })}
                aria-label={t.s_color_picker}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-md border-[1.5px] border-[var(--color-input)] bg-[var(--color-card)] p-1"
              />
              <Input
                {...field}
                value={form.embedColor}
                maxLength={7}
                spellCheck={false}
                autoComplete="off"
                onChange={e => upd({ embedColor: e.target.value })}
                className="w-[9rem] font-mono"
              />
            </div>
          )}
        </FormField>
        <FormField label={t.s_emoji} hint={t.s_emoji_hint}>
          {field => <Input {...field} value={form.buttonEmoji} maxLength={64} onChange={e => upd({ buttonEmoji: e.target.value })} className="w-[9rem]" />}
        </FormField>
        <FormField label={t.s_button_style}>
          {field => (
            <Select {...field} value={form.buttonStyle} onChange={e => upd({ buttonStyle: e.target.value })} className={WIDTH.short}>
              {BUTTON_STYLES.map(s => <option key={s} value={s}>{t[`s_style_${s.toLowerCase()}` as 's_style_primary']}</option>)}
            </Select>
          )}
        </FormField>
        <div className="grid gap-2">
          <p className="font-semibold">{t.s_preview}</p>
          <div className="flex w-fit max-w-full items-stretch gap-3 rounded-md bg-[#313338] p-3">
            <span aria-hidden className="w-1 shrink-0 rounded-full" style={{ backgroundColor: pickerColor }} />
            <span
              className="inline-flex min-h-9 items-center gap-2 rounded-[3px] px-4 text-small font-medium"
              style={{ backgroundColor: style.bg, color: style.fg }}
            >
              {form.buttonEmoji && <span>{form.buttonEmoji}</span>}
              {BUTTON_LABELS[form.lang] ?? BUTTON_LABELS.en}
            </span>
          </div>
          <p className="text-small text-[var(--color-muted-foreground)]">{t.s_preview_hint}</p>
        </div>
      </FormSection>

      <FormSection title={t.s_sec_entry} description={t.s_sec_entry_desc}>
        <NumberWithUnit label={t.s_min_account} hint={t.s_zero_off} unit={t.unit_days} value={form.minAccountDays} onChange={v => upd({ minAccountDays: Number(v) })} />
        <NumberWithUnit label={t.s_min_member} hint={t.s_zero_off} unit={t.unit_days} value={form.minMemberDays} onChange={v => upd({ minMemberDays: Number(v) })} />
      </FormSection>

      <FormSection title={t.s_sec_roles} description={t.s_sec_roles_desc}>
        <RoleSelect label={t.s_manager_role} hint={t.s_manager_hint} roles={d.roles} value={form.managerRole} onChange={v => upd({ managerRole: v })} />
        <MultiPicker
          legend={t.s_blacklist} hint={t.s_blacklist_hint}
          items={roleItems(d.roles)} value={form.blacklist} onChange={v => upd({ blacklist: v })}
          copy={roleCopy(t)} emptyLabel={t.pick_none_excluded}
        />
        <MultiPicker
          legend={t.s_whitelist} hint={t.s_whitelist_hint}
          items={roleItems(d.roles)} value={form.whitelist} onChange={v => upd({ whitelist: v })}
          copy={roleCopy(t)} emptyLabel={t.pick_none_required}
        />
        <BonusEditor roles={d.roles} value={form.bonusRoles ?? {}} onChange={v => upd({ bonusRoles: v })} />
      </FormSection>

      <FormSection title={t.s_sec_notify} description={t.s_sec_notify_desc}>
        <RoleSelect label={t.s_notify_role} roles={d.roles} value={form.notifyRole} onChange={v => upd({ notifyRole: v })} />
        <ChannelSelect
          label={t.s_log_channel} hint={t.s_log_hint} channels={d.channels}
          value={form.logChannel ?? ''} onChange={v => upd({ logChannel: v || null })} placeholder={t.s_none_option}
        />
        <NumberWithUnit label={t.s_reminder} hint={t.s_reminder_hint} unit={t.unit_minutes} value={form.reminderMinutes} onChange={v => upd({ reminderMinutes: Number(v) })} />
      </FormSection>

      <FormSection title={t.s_sec_claim} description={t.s_sec_claim_desc}>
        <FormField label={t.s_claim}>
          {field => <Textarea {...field} value={form.claimMessage ?? ''} rows={4} onChange={e => upd({ claimMessage: e.target.value })} />}
        </FormField>
      </FormSection>

      <SaveBar
        show={dirty}
        message={t.s_unsaved}
        saveLabel={t.s_save}
        discardLabel={t.s_discard}
        busy={busy !== null}
        onSave={() => void save()}
        onDiscard={() => { setForm(saved); setColorError(false) }}
      />
    </div>
  )
}
