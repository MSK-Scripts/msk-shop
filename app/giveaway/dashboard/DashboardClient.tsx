'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift, Plus, Pause, Play, Square, Ban, Dice5, Pencil, Clock,
  LogOut, RefreshCw, Settings as SettingsIcon, Loader2, ExternalLink,
} from 'lucide-react';
import { giveawayDashboardTranslations, type Lang } from '@/lib/i18n';
import { useLang } from '@/components/i18n/LangProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type Dict = Record<keyof typeof giveawayDashboardTranslations['en'], string>;
const Ctx = createContext<{ t: Dict; lang: Lang }>({ t: giveawayDashboardTranslations.en, lang: 'en' });
const useCtx = () => useContext(Ctx);

interface Role { id: string; name: string; color: string }
interface Channel { id: string; name: string }
interface Giveaway {
  id: string; channelId: string; title: string; description: string; prize: string | null;
  winnersCount: number; status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';
  endAt: string | null; createdAt: string | null; endedAt: string | null;
  entryCount: number; winnerIds?: string[]; resultUrl?: string;
}
interface Settings {
  lang: string; embedColor: string; buttonEmoji: string; buttonStyle: string;
  minAccountDays: number; minMemberDays: number; reminderMinutes: number;
  managerRole: string | null; notifyRole: string | null; logChannel: string | null;
  claimMessage: string | null; blacklist: string[]; whitelist: string[];
}

const STATUS_STYLE: Record<Giveaway['status'], string> = {
  ACTIVE:    'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  PAUSED:    'bg-amber-500/15 text-amber-500',
  ENDED:     'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
  CANCELLED: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
};

function StatusBadge({ status }: { status: Giveaway['status'] }) {
  const { t } = useCtx();
  const label = t[`status_${status.toLowerCase()}` as 'status_active'];
  return (
    <span className={cn('rounded px-2 py-0.5 font-mono text-[0.625rem] font-bold uppercase tracking-wider', STATUS_STYLE[status])}>
      {label}
    </span>
  );
}

export default function DashboardClient({ guildId }: { guildId: string }) {
  const router = useRouter();
  const { lang } = useLang();
  const t = giveawayDashboardTranslations[lang];
  const [tab, setTab] = useState<'giveaways' | 'settings'>('giveaways');
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async (kind: string, extra = '') => {
    const res = await fetch(`/api/giveaway/data?kind=${kind}${extra}`, { cache: 'no-store' });
    if (res.status === 401) { router.push('/giveaway/verify'); return null; }
    return res.json().catch(() => null);
  }, [router]);

  const reloadGiveaways = useCallback(async () => {
    const d = await get('giveaways');
    if (d?.giveaways) setGiveaways(d.giveaways);
  }, [get]);

  // Only touches state after the await, so the mount effect below causes no
  // extra render pass (`loading` and `error` already start out correct).
  const runLoadAll = useCallback(async () => {
    try {
      const [gw, st, rl, ch] = await Promise.all([get('giveaways'), get('settings'), get('roles'), get('channels')]);
      if (gw?.giveaways) setGiveaways(gw.giveaways);
      if (st?.settings) setSettings(st.settings);
      if (rl?.roles) setRoles(rl.roles);
      if (ch?.channels) setChannels(ch.channels);
    } catch {
      setError(t.err_load);
    } finally {
      setLoading(false);
    }
  }, [get, t]);

  /** Refresh from a user action — shows the spinner right away. */
  const loadAll = useCallback(() => {
    setLoading(true);
    setError(null);
    return runLoadAll();
  }, [runLoadAll]);

  useEffect(() => {
    async function run() { await runLoadAll(); }
    run();
  }, [runLoadAll]);

  async function logout() {
    await fetch('/api/giveaway/logout', { method: 'POST' });
    router.push('/giveaway/verify');
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
      </main>
    );
  }

  return (
    <Ctx.Provider value={{ t, lang }}>
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t.dashboard_title}</h1>
              <p className="font-mono text-xs text-[var(--color-muted-foreground)]">{t.server} {guildId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadAll} title={t.refresh}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="mr-2 h-4 w-4" /> {t.logout}</Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div>
        )}

        <div className="mb-6 flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-1 text-sm font-semibold">
          {([['giveaways', t.tab_giveaways], ['settings', t.tab_settings]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded px-3 py-1.5 transition-colors',
                tab === key ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {key === 'giveaways' ? <Gift className="h-4 w-4" /> : <SettingsIcon className="h-4 w-4" />} {label}
            </button>
          ))}
        </div>

        {tab === 'giveaways'
          ? <GiveawaysTab giveaways={giveaways} channels={channels} reload={reloadGiveaways} setError={setError} />
          : <SettingsTab settings={settings} roles={roles} channels={channels} onSaved={(s) => setSettings(s)} setError={setError} />}
      </main>
    </Ctx.Provider>
  );
}

// ── Giveaways-Tab ─────────────────────────────────────────────────────────────

function GiveawaysTab({ giveaways, channels, reload, setError }: {
  giveaways: Giveaway[]; channels: Channel[]; reload: () => Promise<void>; setError: (e: string | null) => void;
}) {
  const { t, lang } = useCtx();
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function action(payload: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/giveaway/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(`${t.err_prefix}: ${data?.error ?? res.status}`);
      await reload();
    } catch {
      setError(t.err_network);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" /> {t.new_giveaway}
        </Button>
      </div>

      {showCreate && (
        <CreateForm channels={channels} busy={busy === 'create'} onCreate={async (p) => { await action({ action: 'create', ...p }, 'create'); setShowCreate(false); }} />
      )}

      {giveaways.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">{t.none_yet}</Card>
      ) : (
        giveaways.map((g) => (
          <Card key={g.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={g.status} />
                  <span className="font-mono text-xs text-[var(--color-muted-foreground)]">{g.id}</span>
                </div>
                <h3 className="mt-1 truncate font-semibold">{g.title}</h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {(g.status === 'ENDED' ? (g.winnerIds?.length ?? 0) : g.winnersCount)} {t.winners_unit} · {g.entryCount} {t.entries_unit}
                  {g.endAt && (g.status === 'ACTIVE' || g.status === 'PAUSED') ? ` · ${t.ends} ${new Date(g.endAt).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {g.status === 'ACTIVE' && (
                <>
                  <Button variant="outline" size="sm" disabled={busy?.startsWith(g.id)} onClick={() => action({ action: 'pause', id: g.id }, `${g.id}:pause`)}><Pause className="mr-1.5 h-3.5 w-3.5" /> {t.btn_pause}</Button>
                  <Button variant="outline" size="sm" disabled={busy?.startsWith(g.id)} onClick={() => action({ action: 'end', id: g.id }, `${g.id}:end`)}><Square className="mr-1.5 h-3.5 w-3.5" /> {t.btn_end}</Button>
                  <Button variant="danger" size="sm" disabled={busy?.startsWith(g.id)} onClick={() => action({ action: 'cancel', id: g.id }, `${g.id}:cancel`)}><Ban className="mr-1.5 h-3.5 w-3.5" /> {t.btn_cancel}</Button>
                  <ExtendButton onExtend={(d) => action({ action: 'extend', id: g.id, duration: d }, `${g.id}:extend`)} disabled={busy?.startsWith(g.id)} />
                </>
              )}
              {g.status === 'PAUSED' && (
                <Button variant="outline" size="sm" disabled={busy?.startsWith(g.id)} onClick={() => action({ action: 'resume', id: g.id }, `${g.id}:resume`)}><Play className="mr-1.5 h-3.5 w-3.5" /> {t.btn_resume}</Button>
              )}
              {g.status === 'ENDED' && (
                <>
                  <Button variant="outline" size="sm" disabled={busy?.startsWith(g.id)} onClick={() => action({ action: 'reroll', id: g.id }, `${g.id}:reroll`)}><Dice5 className="mr-1.5 h-3.5 w-3.5" /> {t.btn_reroll_all}</Button>
                  <RerollSingle onReroll={(wid) => action({ action: 'reroll', id: g.id, winnerId: wid }, `${g.id}:reroll1`)} disabled={busy?.startsWith(g.id)} />
                </>
              )}
              {g.resultUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={g.resultUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {t.btn_results}
                  </a>
                </Button>
              )}
              {(g.status === 'ACTIVE' || g.status === 'PAUSED') && (
                <EditButton giveaway={g} onSave={(p) => action({ action: 'edit', id: g.id, ...p }, `${g.id}:edit`)} disabled={busy?.startsWith(g.id)} />
              )}
            </div>

            {g.status === 'ENDED' && g.winnerIds && g.winnerIds.length > 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">{t.winners_label} {g.winnerIds.map((w) => `@${w}`).join(', ')}</p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function CreateForm({ channels, busy, onCreate }: { channels: Channel[]; busy: boolean; onCreate: (p: Record<string, unknown>) => void }) {
  const { t } = useCtx();
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [winnersCount, setWinnersCount] = useState(1);
  const [duration, setDuration] = useState('1d');

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="font-semibold">{t.create_title}</h3>
      <Field label={t.f_channel}>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={selectCls}>
          {channels.map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}
        </select>
      </Field>
      <Field label={t.f_title}><Input value={title} maxLength={256} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={t.f_description}>
        <textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} rows={3} className={selectCls} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t.f_prize_opt}><Input value={prize} maxLength={256} onChange={(e) => setPrize(e.target.value)} /></Field>
        <Field label={t.f_winners}><Input type="number" min={1} max={100} value={winnersCount} onChange={(e) => setWinnersCount(Number(e.target.value))} /></Field>
        <Field label={t.f_duration}><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1d2h30m" /></Field>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={busy || !channelId || !title.trim() || !description.trim()}
          onClick={() => onCreate({ channelId, title: title.trim(), description: description.trim(), prize: prize.trim() || null, winnersCount, duration })}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} {t.btn_create}
        </Button>
      </div>
    </Card>
  );
}

function ExtendButton({ onExtend, disabled }: { onExtend: (d: string) => void; disabled?: boolean }) {
  const { t } = useCtx();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState('1h');
  if (!open) return <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setOpen(true)}><Clock className="mr-1.5 h-3.5 w-3.5" /> {t.btn_extend}</Button>;
  return (
    <span className="flex items-center gap-1">
      <Input value={d} onChange={(e) => setD(e.target.value)} className="h-8 w-20" placeholder="1h" />
      <Button size="sm" disabled={disabled} onClick={() => { onExtend(d); setOpen(false); }}>{t.btn_ok}</Button>
    </span>
  );
}

function RerollSingle({ onReroll, disabled }: { onReroll: (wid: string) => void; disabled?: boolean }) {
  const { t } = useCtx();
  const [open, setOpen] = useState(false);
  const [wid, setWid] = useState('');
  if (!open) return <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setOpen(true)}>{t.btn_reroll_one}</Button>;
  return (
    <span className="flex items-center gap-1">
      <Input value={wid} onChange={(e) => setWid(e.target.value)} className="h-8 w-44" placeholder={t.reroll_one_ph} />
      <Button size="sm" disabled={disabled || !wid.trim()} onClick={() => { onReroll(wid.trim()); setOpen(false); }}>{t.btn_ok}</Button>
    </span>
  );
}

function EditButton({ giveaway, onSave, disabled }: { giveaway: Giveaway; onSave: (p: Record<string, unknown>) => void; disabled?: boolean }) {
  const { t } = useCtx();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(giveaway.title);
  const [description, setDescription] = useState(giveaway.description);
  const [prize, setPrize] = useState(giveaway.prize ?? '');
  const [winnersCount, setWinnersCount] = useState(giveaway.winnersCount);
  if (!open) return <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setOpen(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> {t.btn_edit}</Button>;
  return (
    <Card className="mt-2 flex w-full flex-col gap-3 p-3">
      <Field label={t.f_title}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={t.f_description}><textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)} className={selectCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.f_prize}><Input value={prize} onChange={(e) => setPrize(e.target.value)} /></Field>
        <Field label={t.f_winners}><Input type="number" min={1} max={100} value={winnersCount} onChange={(e) => setWinnersCount(Number(e.target.value))} /></Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{t.btn_cancel}</Button>
        <Button size="sm" disabled={disabled} onClick={() => { onSave({ title, description, prize: prize || null, winnersCount }); setOpen(false); }}>{t.btn_save}</Button>
      </div>
    </Card>
  );
}

// ── Settings-Tab ──────────────────────────────────────────────────────────────

function SettingsTab({ settings, roles, channels, onSaved, setError }: {
  settings: Settings | null; roles: Role[]; channels: Channel[];
  onSaved: (s: Settings) => void; setError: (e: string | null) => void;
}) {
  const { t } = useCtx();
  const [form, setForm] = useState<Settings | null>(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Discard local edits whenever a fresh settings object arrives from the
  // server. Adjusting during render instead of in an effect means React redoes
  // this render before committing, rather than painting the stale form first.
  const [lastSettings, setLastSettings] = useState(settings);
  if (lastSettings !== settings) {
    setLastSettings(settings);
    setForm(settings);
  }

  const upd = (patch: Partial<Settings>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function save() {
    if (!form) return;
    setBusy(true); setError(null); setSaved(false);
    try {
      const res = await fetch('/api/giveaway/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settings',
          lang: form.lang, embedColor: form.embedColor, buttonEmoji: form.buttonEmoji, buttonStyle: form.buttonStyle,
          minAccountDays: Number(form.minAccountDays) || 0, minMemberDays: Number(form.minMemberDays) || 0,
          reminderMinutes: Number(form.reminderMinutes) || 0,
          managerRole: form.managerRole || null, notifyRole: form.notifyRole || null, logChannel: form.logChannel || null,
          claimMessage: form.claimMessage || null, blacklist: form.blacklist, whitelist: form.whitelist,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(`${t.err_prefix}: ${data?.error ?? res.status}`); return; }
      if (data?.settings) onSaved(data.settings);
      setSaved(true);
    } catch {
      setError(t.err_network);
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">{t.s_unavailable}</Card>;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t.s_language}>
          <select value={form.lang} onChange={(e) => upd({ lang: e.target.value })} className={selectCls}>
            {['en', 'de', 'fr', 'es'].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </Field>
        <Field label={t.s_color}><Input value={form.embedColor} onChange={(e) => upd({ embedColor: e.target.value })} placeholder="#00e676" /></Field>
        <Field label={t.s_emoji}><Input value={form.buttonEmoji} onChange={(e) => upd({ buttonEmoji: e.target.value })} /></Field>
        <Field label={t.s_button_style}>
          <select value={form.buttonStyle} onChange={(e) => upd({ buttonStyle: e.target.value })} className={selectCls}>
            {['PRIMARY', 'SECONDARY', 'SUCCESS', 'DANGER'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label={t.s_reminder}><Input type="number" min={0} value={form.reminderMinutes} onChange={(e) => upd({ reminderMinutes: Number(e.target.value) })} /></Field>
        <Field label={t.s_min_account}><Input type="number" min={0} value={form.minAccountDays} onChange={(e) => upd({ minAccountDays: Number(e.target.value) })} /></Field>
        <Field label={t.s_min_member}><Input type="number" min={0} value={form.minMemberDays} onChange={(e) => upd({ minMemberDays: Number(e.target.value) })} /></Field>
        <Field label={t.s_manager_role}>
          <RoleSelect roles={roles} value={form.managerRole} onChange={(v) => upd({ managerRole: v })} />
        </Field>
        <Field label={t.s_notify_role}>
          <RoleSelect roles={roles} value={form.notifyRole} onChange={(v) => upd({ notifyRole: v })} />
        </Field>
        <Field label={t.s_log_channel}>
          <select value={form.logChannel ?? ''} onChange={(e) => upd({ logChannel: e.target.value || null })} className={selectCls}>
            <option value="">{t.s_none_option}</option>
            {channels.map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label={t.s_blacklist}>
        <RoleMultiSelect roles={roles} value={form.blacklist} onChange={(v) => upd({ blacklist: v })} />
      </Field>
      <Field label={t.s_whitelist}>
        <RoleMultiSelect roles={roles} value={form.whitelist} onChange={(v) => upd({ whitelist: v })} />
      </Field>

      <Field label={t.s_claim}>
        <textarea value={form.claimMessage ?? ''} rows={2} onChange={(e) => upd({ claimMessage: e.target.value })} className={selectCls} />
      </Field>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-[var(--color-primary)]">{t.s_saved}</span>}
        <Button size="sm" disabled={busy} onClick={save}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t.s_save}
        </Button>
      </div>
    </Card>
  );
}

function RoleSelect({ roles, value, onChange }: { roles: Role[]; value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useCtx();
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className={selectCls}>
      <option value="">{t.s_none_option}</option>
      {roles.map((r) => <option key={r.id} value={r.id}>@ {r.name}</option>)}
    </select>
  );
}

function RoleMultiSelect({ roles, value, onChange }: { roles: Role[]; value: string[]; onChange: (v: string[]) => void }) {
  const { t } = useCtx();
  const set = useMemo(() => new Set(value), [value]);
  const toggle = (id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange([...next]);
  };
  return (
    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2">
      {roles.length === 0 && <span className="text-xs text-[var(--color-muted-foreground)]">{t.s_no_roles}</span>}
      {roles.map((r) => (
        <button key={r.id} type="button" onClick={() => toggle(r.id)}
          className={cn('rounded px-2 py-0.5 text-xs transition-colors',
            set.has(r.id) ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]')}>
          {r.name}
        </button>
      ))}
    </div>
  );
}

// ── kleine UI-Helfer ──────────────────────────────────────────────────────────

const selectCls = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}
