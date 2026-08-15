'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift, Plus, Pause, Play, Square, Ban, Dice5, Pencil, Clock,
  LogOut, RefreshCw, Settings as SettingsIcon, Loader2, ExternalLink,
  Store, Ticket, Eye, EyeOff, Trash2, ShieldCheck,
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
type PrizeMode = 'ALL' | 'INDIVIDUAL';
interface GiveawayWinner { userId: string; prizeIndex: number | null }
interface Giveaway {
  id: string; channelId: string; title: string; description: string;
  prizes: string[]; prizeMode: PrizeMode;
  winnersCount: number; status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';
  endAt: string | null; createdAt: string | null; endedAt: string | null;
  entryCount: number; winnerIds?: string[]; winners?: GiveawayWinner[]; resultUrl?: string;
  couponPercent: number | null; couponPackages: number[]; couponValidDays: number | null;
}

/** Ein Preis pro Zeile, gleiche Regel wie im Bot (src/utils/prizes.js). */
const MAX_PRIZES = 20;
function splitPrizes(text: string): string[] {
  return text.split(/\r?\n|\|/).map((p) => p.trim()).filter(Boolean).slice(0, MAX_PRIZES);
}
interface TebexPackage { id: number; name: string; price: number }
interface TebexStatus {
  configured: boolean; hint: string | null; setAt: string | null;
  publicToken: string | null; storeUrl: string | null; encryptionReady: boolean;
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

export default function DashboardClient({ guildId, owner }: { guildId: string; owner: boolean }) {
  const router = useRouter();
  const { lang } = useLang();
  const t = giveawayDashboardTranslations[lang];
  const [tab, setTab] = useState<'giveaways' | 'settings' | 'store'>('giveaways');
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tebex, setTebex] = useState<TebexStatus | null>(null);
  const [packages, setPackages] = useState<TebexPackage[]>([]);
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
      // Der Tebex-Status wird nur für Besitzer geladen — für alle anderen
      // antwortet der Bot ohnehin mit 403.
      const [gw, st, rl, ch, tx] = await Promise.all([
        get('giveaways'), get('settings'), get('roles'), get('channels'),
        owner ? get('tebex') : Promise.resolve(null),
      ]);
      if (gw?.giveaways) setGiveaways(gw.giveaways);
      if (st?.settings) setSettings(st.settings);
      if (rl?.roles) setRoles(rl.roles);
      if (ch?.channels) setChannels(ch.channels);
      if (tx?.tebex) {
        setTebex(tx.tebex);
        // Die Paketliste hängt am öffentlichen Token, nicht am Secret.
        if (tx.tebex.publicToken) {
          const pk = await get('tebexPackages');
          if (pk?.packages) setPackages(pk.packages);
        }
      }
    } catch {
      setError(t.err_load);
    } finally {
      setLoading(false);
    }
  }, [get, t, owner]);

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
      {/* Bewusst weiterhin gedeckelt: der Inhalt ist eine Einstellungs-
          maske plus Giveaway-Liste. Ein 1920 px breites Formularfeld ist
          nicht benutzbarer als ein 1000 px breites, nur schwerer zu lesen.
          Der Deckel ist gegenüber max-w-4xl aber deutlich angehoben. */}
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
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
          {([
            ['giveaways', t.tab_giveaways],
            ['settings', t.tab_settings],
            // Der Store-Reiter existiert nur für den Server-Besitzer.
            ...(owner ? [['store', t.tab_store] as const] : []),
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded px-3 py-1.5 transition-colors',
                tab === key ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
              )}
            >
              {key === 'giveaways' ? <Gift className="h-4 w-4" /> : key === 'store' ? <Store className="h-4 w-4" /> : <SettingsIcon className="h-4 w-4" />} {label}
            </button>
          ))}
        </div>

        {tab === 'giveaways' && (
          <GiveawaysTab
            giveaways={giveaways} channels={channels} reload={reloadGiveaways} setError={setError}
            packages={packages} couponReady={Boolean(tebex?.configured)} ownerHint={owner}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab settings={settings} roles={roles} channels={channels} onSaved={(s) => setSettings(s)} setError={setError} />
        )}
        {tab === 'store' && owner && (
          <StoreTab tebex={tebex} packages={packages} onChanged={(s) => setTebex(s)} setError={setError} />
        )}
      </main>
    </Ctx.Provider>
  );
}

// ── Giveaways-Tab ─────────────────────────────────────────────────────────────

function GiveawaysTab({ giveaways, channels, reload, setError, packages, couponReady, ownerHint }: {
  giveaways: Giveaway[]; channels: Channel[]; reload: () => Promise<void>; setError: (e: string | null) => void;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean;
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
        <CreateForm
          channels={channels} busy={busy === 'create'} packages={packages}
          couponReady={couponReady} ownerHint={ownerHint}
          onCreate={async (p) => { await action({ action: 'create', ...p }, 'create'); setShowCreate(false); }}
        />
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
                {g.couponPercent != null && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--color-primary)]">
                    <Ticket className="h-3 w-3" />
                    {g.couponPercent}% {t.c_off}
                    {g.couponValidDays ? ` · ${g.couponValidDays}d` : ` · ${t.c_never}`}
                  </span>
                )}
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
                <EditButton
                  giveaway={g} packages={packages} couponReady={couponReady} ownerHint={ownerHint}
                  onSave={(p) => action({ action: 'edit', id: g.id, ...p }, `${g.id}:edit`)}
                  disabled={busy?.startsWith(g.id)}
                />
              )}
            </div>

            {g.prizes?.length > 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t.prizes_label}{' '}
                {g.prizeMode === 'INDIVIDUAL'
                  ? g.prizes.map((p, i) => `${i + 1}. ${p}`).join(' · ')
                  : g.prizes.join(', ')}
              </p>
            )}

            {g.status === 'ENDED' && g.winnerIds && g.winnerIds.length > 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {t.winners_label}{' '}
                {/* Bei einem Preis pro Gewinner steht der Preis direkt dahinter,
                    sonst wäre die Zuordnung im Dashboard nicht ablesbar. */}
                {g.prizeMode === 'INDIVIDUAL' && g.winners?.length
                  ? g.winners.map((w) => `@${w.userId}${w.prizeIndex != null && g.prizes[w.prizeIndex] ? ` (${g.prizes[w.prizeIndex]})` : ''}`).join(', ')
                  : g.winnerIds.map((w) => `@${w}`).join(', ')}
              </p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

/**
 * Coupon-Konfiguration eines Giveaways. Leeres Prozentfeld = kein Coupon.
 * Die Paketauswahl gibt es nur, wenn ein öffentlicher Token hinterlegt ist,
 * sonst wäre die Liste leer und der Rabatt gilt für den ganzen Warenkorb.
 */
function CouponFields({ percent, setPercent, validDays, setValidDays, selected, setSelected, packages, couponReady, ownerHint }: {
  percent: string; setPercent: (v: string) => void;
  validDays: string; setValidDays: (v: string) => void;
  selected: number[]; setSelected: (v: number[]) => void;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean;
}) {
  const { t } = useCtx();

  if (!couponReady) {
    // Ohne hinterlegten Store hat das Feld keine Wirkung — der Hinweis ist nur
    // für Besitzer nützlich, alle anderen können daran nichts ändern.
    return ownerHint
      ? <p className="text-xs text-[var(--color-muted-foreground)]">{t.c_needs_store}</p>
      : null;
  }

  const toggle = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]);
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-[var(--color-primary)]" />
        <span className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">{t.c_section}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.c_percent}>
          <Input type="number" min={1} max={100} value={percent} placeholder="—"
            onChange={(e) => setPercent(e.target.value)} />
        </Field>
        <Field label={t.c_valid_days}>
          <Input type="number" min={1} max={3650} value={validDays} placeholder={t.c_never}
            onChange={(e) => setValidDays(e.target.value)} />
        </Field>
      </div>
      {packages.length > 0 && (
        <Field label={t.c_packages}>
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2">
            {selected.length === 0 && (
              <span className="text-xs text-[var(--color-muted-foreground)]">{t.c_all_packages}</span>
            )}
            {packages.map((p) => (
              <button key={p.id} type="button" onClick={() => toggle(p.id)}
                className={cn('rounded px-2 py-0.5 text-xs transition-colors',
                  selected.includes(p.id)
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]')}>
                {p.name}
              </button>
            ))}
          </div>
        </Field>
      )}
      <p className="text-xs text-[var(--color-muted-foreground)]">{t.c_hint}</p>
    </div>
  );
}

/**
 * Preisliste, Verteilmodus und Gewinnerzahl.
 *
 * Bei "ein Preis pro Gewinner" ist die Gewinnerzahl keine eigene Angabe mehr,
 * sondern die Länge der Liste. Das Feld wird deshalb gesperrt und mitgeführt,
 * statt den Nutzer erst absenden und dann eine Fehlermeldung lesen zu lassen.
 */
function PrizeFields({ prizes, setPrizes, mode, setMode, winnersCount, setWinnersCount }: {
  prizes: string; setPrizes: (v: string) => void;
  mode: PrizeMode; setMode: (v: PrizeMode) => void;
  winnersCount: number; setWinnersCount: (v: number) => void;
}) {
  const { t } = useCtx();
  const individual = mode === 'INDIVIDUAL';
  const count = splitPrizes(prizes).length;
  const effectiveWinners = individual ? Math.max(count, 1) : winnersCount;

  return (
    <>
      <Field label={t.f_prizes}>
        <textarea
          value={prizes}
          rows={3}
          maxLength={2000}
          placeholder={t.f_prizes_ph}
          onChange={(e) => setPrizes(e.target.value)}
          className={selectCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.f_prize_mode}>
          <select value={mode} onChange={(e) => setMode(e.target.value as PrizeMode)} className={selectCls}>
            <option value="ALL">{t.mode_all}</option>
            <option value="INDIVIDUAL">{t.mode_individual}</option>
          </select>
        </Field>
        <Field label={t.f_winners}>
          <Input
            type="number" min={1} max={100}
            value={effectiveWinners}
            disabled={individual}
            onChange={(e) => setWinnersCount(Number(e.target.value))}
          />
        </Field>
      </div>
      {individual && <p className="text-xs text-[var(--color-muted-foreground)]">{t.prize_mode_hint}</p>}
    </>
  );
}

/** Preis-Eingaben in das Format des Steuer-Endpunkts bringen. */
function prizePayload(prizes: string, mode: PrizeMode, winnersCount: number) {
  const list = splitPrizes(prizes);
  return {
    prizes: list,
    prizeMode: list.length ? mode : 'ALL', // ohne Preise ist der Modus bedeutungslos
    winnersCount: mode === 'INDIVIDUAL' && list.length ? list.length : winnersCount,
  };
}

/** Coupon-Eingaben in das Format des Steuer-Endpunkts bringen. */
function couponPayload(percent: string, validDays: string, selected: number[]) {
  return {
    couponPercent:   percent.trim() === '' ? null : Number(percent),
    couponValidDays: validDays.trim() === '' ? null : Number(validDays),
    couponPackages:  selected,
  };
}

function CreateForm({ channels, busy, onCreate, packages, couponReady, ownerHint }: {
  channels: Channel[]; busy: boolean; onCreate: (p: Record<string, unknown>) => void;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean;
}) {
  const { t } = useCtx();
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizes, setPrizes] = useState('');
  const [prizeMode, setPrizeMode] = useState<PrizeMode>('ALL');
  const [winnersCount, setWinnersCount] = useState(1);
  const [duration, setDuration] = useState('1d');
  const [percent, setPercent] = useState('');
  const [validDays, setValidDays] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

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
      <PrizeFields
        prizes={prizes} setPrizes={setPrizes}
        mode={prizeMode} setMode={setPrizeMode}
        winnersCount={winnersCount} setWinnersCount={setWinnersCount}
      />
      <Field label={t.f_duration}><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1d2h30m" /></Field>

      <CouponFields
        percent={percent} setPercent={setPercent}
        validDays={validDays} setValidDays={setValidDays}
        selected={selected} setSelected={setSelected}
        packages={packages} couponReady={couponReady} ownerHint={ownerHint}
      />

      <div className="flex justify-end">
        <Button size="sm" disabled={busy || !channelId || !title.trim() || !description.trim()}
          onClick={() => onCreate({
            channelId, title: title.trim(), description: description.trim(), duration,
            ...prizePayload(prizes, prizeMode, winnersCount),
            ...couponPayload(percent, validDays, selected),
          })}>
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

function EditButton({ giveaway, onSave, disabled, packages, couponReady, ownerHint }: {
  giveaway: Giveaway; onSave: (p: Record<string, unknown>) => void; disabled?: boolean;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean;
}) {
  const { t } = useCtx();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(giveaway.title);
  const [description, setDescription] = useState(giveaway.description);
  const [prizes, setPrizes] = useState((giveaway.prizes ?? []).join('\n'));
  const [prizeMode, setPrizeMode] = useState<PrizeMode>(giveaway.prizeMode ?? 'ALL');
  const [winnersCount, setWinnersCount] = useState(giveaway.winnersCount);
  const [percent, setPercent] = useState(giveaway.couponPercent == null ? '' : String(giveaway.couponPercent));
  const [validDays, setValidDays] = useState(giveaway.couponValidDays == null ? '' : String(giveaway.couponValidDays));
  const [selected, setSelected] = useState<number[]>(giveaway.couponPackages ?? []);
  if (!open) return <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setOpen(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> {t.btn_edit}</Button>;
  return (
    <Card className="mt-2 flex w-full flex-col gap-3 p-3">
      <Field label={t.f_title}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={t.f_description}><textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)} className={selectCls} /></Field>
      <PrizeFields
        prizes={prizes} setPrizes={setPrizes}
        mode={prizeMode} setMode={setPrizeMode}
        winnersCount={winnersCount} setWinnersCount={setWinnersCount}
      />
      <CouponFields
        percent={percent} setPercent={setPercent}
        validDays={validDays} setValidDays={setValidDays}
        selected={selected} setSelected={setSelected}
        packages={packages} couponReady={couponReady} ownerHint={ownerHint}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{t.btn_cancel}</Button>
        <Button size="sm" disabled={disabled} onClick={() => {
          onSave({
            title, description,
            ...prizePayload(prizes, prizeMode, winnersCount),
            ...couponPayload(percent, validDays, selected),
          });
          setOpen(false);
        }}>{t.btn_save}</Button>
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

// ── Tebex-Store-Tab (nur Server-Besitzer) ─────────────────────────────────────

/**
 * Verwaltung des Tebex-Stores dieser Guild.
 *
 * Der Plugin-Schlüssel ist Vollzugriff auf den Shop des Besitzers. Er wird
 * verschlüsselt beim Bot gespeichert, kommt hier nur maskiert an (letzte vier
 * Zeichen) und wird im Klartext ausschließlich auf ausdrücklichen Klick
 * nachgeladen. Die eigentliche Berechtigungsprüfung macht der Bot gegen
 * guild.ownerId — dieses Formular ist nur die Oberfläche dazu.
 */
function StoreTab({ tebex, packages, onChanged, setError }: {
  tebex: TebexStatus | null; packages: TebexPackage[];
  onChanged: (s: TebexStatus) => void; setError: (e: string | null) => void;
}) {
  const { t, lang } = useCtx();
  const [secret, setSecret] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState(tebex?.publicToken ?? '');
  const [storeUrl, setStoreUrl] = useState(tebex?.storeUrl ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [store, setStore] = useState<string | null>(null);

  async function act(action: string, payload: Record<string, unknown>, key: string) {
    setBusy(key); setError(null);
    try {
      const res = await fetch('/api/giveaway/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const code = data?.error;
        setError(
          code === 'invalid_secret' ? t.store_err_invalid
            : code === 'owner_only' ? t.store_err_owner
            : code === 'reauth_required' ? t.store_reauth
            : code === 'encryption_unavailable' ? t.store_no_key
            : `${t.err_prefix}: ${code ?? res.status}`,
        );
        return null;
      }
      return data;
    } catch {
      setError(t.err_network);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function saveSecret() {
    const data = await act('tebexSecret', { secret: secret.trim() }, 'secret');
    if (!data) return;
    setSecret('');
    setRevealed(null);
    setStore(data.store ?? null);
    onChanged({ ...(tebex as TebexStatus), configured: true, hint: data.hint ?? null, setAt: new Date().toISOString() });
  }

  async function reveal() {
    if (revealed) { setRevealed(null); return; }
    const data = await act('tebexReveal', {}, 'reveal');
    if (data?.secret) setRevealed(data.secret);
  }

  async function clear() {
    const data = await act('tebexClear', {}, 'clear');
    if (!data) return;
    setRevealed(null);
    setStore(null);
    onChanged({ ...(tebex as TebexStatus), configured: false, hint: null, setAt: null });
  }

  async function saveStore() {
    const data = await act('tebexStore', { publicToken: publicToken.trim(), storeUrl: storeUrl.trim() }, 'store');
    if (!data) return;
    onChanged({ ...(tebex as TebexStatus), publicToken: publicToken.trim() || null, storeUrl: storeUrl.trim() || null });
  }

  if (!tebex) return <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">{t.s_unavailable}</Card>;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="font-semibold">{t.store_title}</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.store_intro}</p>
        </div>

        {!tebex.encryptionReady && (
          <div className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {t.store_no_key}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {tebex.configured ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded bg-[var(--color-primary)]/15 px-2 py-0.5 font-mono text-xs text-[var(--color-primary)]">
                <ShieldCheck className="h-3.5 w-3.5" /> {t.store_set} · ••••{tebex.hint}
              </span>
              {tebex.setAt && (
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {t.store_since} {new Date(tebex.setAt).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US')}
                </span>
              )}
              {store && <span className="text-xs text-[var(--color-muted-foreground)]">· {t.store_verified} {store}</span>}
            </>
          ) : (
            <span className="rounded bg-[var(--color-muted)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted-foreground)]">{t.store_not_set}</span>
          )}
        </div>

        {revealed && (
          <code className="select-all break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs">
            {revealed}
          </code>
        )}

        <Field label={t.store_secret}>
          <Input type="password" value={secret} placeholder={t.store_secret_ph} autoComplete="off"
            onChange={(e) => setSecret(e.target.value)} />
        </Field>

        <div className="flex flex-wrap justify-end gap-2">
          {tebex.configured && (
            <>
              <Button variant="ghost" size="sm" disabled={busy === 'reveal'} onClick={reveal}>
                {revealed ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                {revealed ? t.store_hide : t.store_reveal}
              </Button>
              <Button variant="danger" size="sm" disabled={busy === 'clear'} onClick={clear}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {t.store_clear}
              </Button>
            </>
          )}
          <Button size="sm" disabled={busy === 'secret' || !secret.trim() || !tebex.encryptionReady} onClick={saveSecret}>
            {busy === 'secret' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t.store_save}
          </Button>
        </div>

        <p className="text-xs text-[var(--color-muted-foreground)]">{t.store_note}</p>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <Field label={t.store_public}>
          <Input value={publicToken} onChange={(e) => setPublicToken(e.target.value)} autoComplete="off" />
        </Field>
        <Field label={t.store_url}>
          <Input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://" />
        </Field>
        {packages.length > 0 && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{packages.length} × {t.c_packages}</p>
        )}
        <div className="flex justify-end">
          <Button size="sm" disabled={busy === 'store'} onClick={saveStore}>
            {busy === 'store' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {t.store_save_store}
          </Button>
        </div>
      </Card>
    </div>
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
