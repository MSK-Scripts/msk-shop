'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift, Plus, Pause, Play, Square, Ban, Dice5, Pencil, Clock,
  LogOut, RefreshCw, Settings as SettingsIcon, Loader2, ExternalLink,
  Store, Ticket, Eye, EyeOff, Trash2, ShieldCheck, LayoutTemplate, Save, Zap,
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
/**
 * How the winners are determined. Sits next to the prize mode, not inside it:
 * one says WHO wins, the other WHAT the winners get.
 */
type WinnerMode = 'RANDOM' | 'FIRST_CLICK';
interface GiveawayWinner { userId: string; prizeIndex: number | null }
interface Giveaway {
  id: string; channelId: string; title: string; description: string;
  prizes: string[]; prizeMode: PrizeMode; winnerMode: WinnerMode;
  winnersCount: number; status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';
  endAt: string | null; createdAt: string | null; endedAt: string | null;
  entryCount: number; winnerIds?: string[]; winners?: GiveawayWinner[]; resultUrl?: string;
  couponPercent: number | null; couponPackages: number[]; couponValidDays: number | null;
  /** Paketauswahl je Preis-Slot, gleich indiziert wie `prizes`. */
  couponPackagesPerPrize?: number[][];
  /** Fest eingetragene Codes aus einem fremden Shop. */
  couponManualCode?: string | null;
  couponManualCodesPerPrize?: string[];
  couponManualNote?: string | null;
  /**
   * Bedingungen dieses Giveaways. Sie ERSETZEN die serverweiten, jedes Feld für
   * sich. `null` heißt "nichts Eigenes", dann gilt die Server-Einstellung —
   * eine leere Liste dagegen heißt "für dieses Giveaway gilt keine".
   */
  blacklistRoles?: string[] | null;
  whitelistRoles?: string[] | null;
  bonusRoles?: Record<string, number> | null;
}

/**
 * Ein vorbereitetes Giveaway ohne Kanal und ohne Endzeitpunkt.
 * Trägt seit Bot v1.7.0 die Preisliste und seit v1.9.0 die Bedingungen — ohne
 * sie könnte eine Vorlage nicht abbilden, was ein Giveaway ausmacht.
 */
interface Template {
  id: number; name: string; title: string; description: string;
  duration: string; winnersCount: number; prizes: string[]; prizeMode: PrizeMode; winnerMode: WinnerMode;
  /** null = die Vorlage sagt nichts dazu, das Giveaway erbt die Server-Einstellung. */
  blacklistRoles?: string[] | null;
  whitelistRoles?: string[] | null;
  bonusRoles?: Record<string, number> | null;
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
  /** Rollen-ID zu zusätzlichen Losen (gewichtete Ziehung), serverweit. */
  bonusRoles: Record<string, number>;
}

/** Bonus-Lose je Rolle, wie der Bot sie annimmt (ganze Zahl von 1 bis 100). */
const MIN_BONUS = 1;
const MAX_BONUS = 100;
function clampBonus(value: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, raw] of Object.entries(value ?? {})) {
    const n = Math.round(Number(raw));
    if (Number.isFinite(n)) out[id] = Math.min(MAX_BONUS, Math.max(MIN_BONUS, n));
  }
  return out;
}

const STATUS_STYLE: Record<Giveaway['status'], string> = {
  ACTIVE:    'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  PAUSED:    'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
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
  const [tab, setTab] = useState<'giveaways' | 'templates' | 'settings' | 'store'>('giveaways');
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
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

  const reloadTemplates = useCallback(async () => {
    const d = await get('templates');
    if (d?.templates) setTemplates(d.templates);
  }, [get]);

  // Only touches state after the await, so the mount effect below causes no
  // extra render pass (`loading` and `error` already start out correct).
  const runLoadAll = useCallback(async () => {
    try {
      // Der Tebex-Status wird nur für Besitzer geladen — für alle anderen
      // antwortet der Bot ohnehin mit 403.
      const [gw, st, rl, ch, tp, tx] = await Promise.all([
        get('giveaways'), get('settings'), get('roles'), get('channels'), get('templates'),
        owner ? get('tebex') : Promise.resolve(null),
      ]);
      if (gw?.giveaways) setGiveaways(gw.giveaways);
      if (tp?.templates) setTemplates(tp.templates);
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
      {/* Bewusst gedeckelt: der Inhalt ist eine Einstellungsmaske plus
          Giveaway-Liste. Ein 1920 px breites Formularfeld ist nicht
          benutzbarer als ein 1000 px breites, nur schwerer zu lesen.
          Seit 22.08.2026 `container-page` statt eines eigenen max-w-6xl,
          damit dieses Dashboard und das Ticketbot-Dashboard gleich breit
          sind. Vorher standen sie auf 1152 gegen 2560 px. */}
      <main className="container-page w-full py-10">
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
          <div role="alert" className="mb-4 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div>
        )}

        <div className="mb-6 flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-1 text-sm font-semibold">
          {([
            ['giveaways', t.tab_giveaways],
            ['templates', t.tab_templates],
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
              {key === 'giveaways' ? <Gift className="h-4 w-4" /> : key === 'templates' ? <LayoutTemplate className="h-4 w-4" /> : key === 'store' ? <Store className="h-4 w-4" /> : <SettingsIcon className="h-4 w-4" />} {label}
            </button>
          ))}
        </div>

        {tab === 'giveaways' && (
          <GiveawaysTab
            giveaways={giveaways} channels={channels} roles={roles} reload={reloadGiveaways} setError={setError}
            packages={packages} couponReady={Boolean(tebex?.configured)} ownerHint={owner}
            templates={templates} settings={settings} reloadTemplates={reloadTemplates}
          />
        )}
        {tab === 'templates' && (
          <TemplatesTab templates={templates} roles={roles} settings={settings} reload={reloadTemplates} setError={setError} />
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

function GiveawaysTab({ giveaways, channels, roles, reload, setError, packages, couponReady, ownerHint, templates, settings, reloadTemplates }: {
  giveaways: Giveaway[]; channels: Channel[]; roles: Role[]; reload: () => Promise<void>; setError: (e: string | null) => void;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean; templates: Template[];
  settings: Settings | null; reloadTemplates: () => Promise<void>;
}) {
  const { t, lang } = useCtx();
  const [busy, setBusy] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  // Welches Giveaway zuletzt als Vorlage gesichert wurde, nur für die Rückmeldung
  // an der Karte. Der Vorlagen-Reiter zeigt das Ergebnis.
  const [savedTemplate, setSavedTemplate] = useState<string | null>(null);

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

  /**
   * Ein Giveaway als Vorlage sichern.
   *
   * Eigene Funktion statt `action`: hier ist danach die Vorlagen-Liste veraltet,
   * nicht die Giveaway-Liste. Der Bot baut die Vorlage aus dem Datensatz, von
   * hier gehen nur ID und Name hin.
   */
  async function saveAsTemplate(g: Giveaway) {
    const name = window.prompt(t.tpl_from_ask, g.title);
    if (name === null) return;
    setBusy(`${g.id}:tpl`);
    setError(null);
    try {
      const res = await fetch('/api/giveaway/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'templateFrom', id: g.id, name: name.trim() || g.title }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(`${t.err_prefix}: ${data?.error ?? res.status}`); return; }
      await reloadTemplates();
      setSavedTemplate(g.id);
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
          channels={channels} roles={roles} busy={busy === 'create'} packages={packages}
          couponReady={couponReady} ownerHint={ownerHint} templates={templates} settings={settings}
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
                <DrawBadge mode={g.winnerMode} />
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
                  giveaway={g} roles={roles} settings={settings} packages={packages} couponReady={couponReady} ownerHint={ownerHint}
                  onSave={(p) => action({ action: 'edit', id: g.id, ...p }, `${g.id}:edit`)}
                  disabled={busy?.startsWith(g.id)}
                />
              )}
              {/* Für jeden Status: auch ein laufendes Giveaway darf man sichern,
                  wenn man es wiederholen will. */}
              <Button variant="ghost" size="sm" disabled={busy?.startsWith(g.id)} onClick={() => saveAsTemplate(g)}>
                <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> {savedTemplate === g.id ? t.tpl_from_done : t.tpl_from}
              </Button>
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
function PackagePicker({ packages, selected, onToggle }: {
  packages: TebexPackage[]; selected: number[]; onToggle: (id: number) => void;
}) {
  const { t } = useCtx();
  return (
    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2">
      {selected.length === 0 && (
        <span className="text-xs text-[var(--color-muted-foreground)]">{t.c_all_packages}</span>
      )}
      {packages.map((p) => (
        <button key={p.id} type="button" onClick={() => onToggle(p.id)}
          className={cn('rounded px-2 py-0.5 text-xs transition-colors',
            selected.includes(p.id)
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]')}>
          {p.name}
        </button>
      ))}
    </div>
  );
}

/**
 * Fest eingetragene Codes aus einem FREMDEN Shop.
 *
 * Steht bewusst außerhalb der Store-Prüfung: der Sinn ist ja gerade das
 * gemeinsame Giveaway mit einem anderen Entwickler, bei dem der Bot keinen
 * Zugriff auf dessen Shop hat und deshalb auch keinen eigenen Store braucht.
 */
function ManualCodeFields({ code, setCode, perPrize, setPerPrize, note, setNote, prizes, mode }: {
  code: string; setCode: (v: string) => void;
  perPrize: string[]; setPerPrize: (v: string[]) => void;
  note: string; setNote: (v: string) => void;
  prizes: string[]; mode: PrizeMode;
}) {
  const { t } = useCtx();
  const perWinner = mode === 'INDIVIDUAL' && prizes.length > 0;
  const slotOf = (i: number) => perPrize[i] ?? '';
  const setSlot = (i: number, value: string) => {
    const next = Array.from({ length: prizes.length }, (_, k) => slotOf(k));
    next[i] = value;
    setPerPrize(next);
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <span className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">{t.c_manual_section}</span>
      </div>

      <Field label={t.c_manual_code}>
        <Input value={code} maxLength={128} placeholder="—" onChange={(e) => setCode(e.target.value)} />
      </Field>

      {perWinner && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {t.c_manual_per}
          </span>
          {prizes.map((prize, i) => (
            <Field key={i} label={`${i + 1}. ${prize}`}>
              <Input value={slotOf(i)} maxLength={128} placeholder="—" onChange={(e) => setSlot(i, e.target.value)} />
            </Field>
          ))}
        </div>
      )}

      <Field label={t.c_manual_note}>
        <Input value={note} maxLength={500} placeholder="—" onChange={(e) => setNote(e.target.value)} />
      </Field>

      <p className="text-xs text-[var(--color-muted-foreground)]">{t.c_manual_hint}</p>
    </div>
  );
}

function CouponFields({ percent, setPercent, validDays, setValidDays, selected, setSelected, perPrize, setPerPrize, prizes, mode, packages, couponReady, ownerHint }: {
  percent: string; setPercent: (v: string) => void;
  validDays: string; setValidDays: (v: string) => void;
  selected: number[]; setSelected: (v: number[]) => void;
  perPrize: number[][]; setPerPrize: (v: number[][]) => void;
  prizes: string[]; mode: PrizeMode;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean;
}) {
  const { t } = useCtx();

  if (!couponReady) {
    // Ohne hinterlegten Store kann der Bot keine eigenen Coupons erzeugen — der
    // Hinweis darauf ist nur für Besitzer nützlich, alle anderen können daran
    // nichts ändern. Die festen Codes eines fremden Shops hängen davon nicht ab
    // und stehen deshalb im Aufrufer, nicht hier.
    return ownerHint
      ? <p className="text-xs text-[var(--color-muted-foreground)]">{t.c_needs_store}</p>
      : null;
  }

  const toggle = (id: number) => {
    setSelected(selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]);
  };

  // Eine Auswahl je Gewinner gibt es nur mit Preis-Slots: ohne sie ist die
  // Ziehungsreihenfolge willkürlich, ein "Gewinner 2" existiert also nicht.
  const perWinner = mode === 'INDIVIDUAL' && prizes.length > 0;
  const slotOf = (i: number) => perPrize[i] ?? [];
  const toggleSlot = (i: number, id: number) => {
    const current = slotOf(i);
    const next = Array.from({ length: prizes.length }, (_, k) => slotOf(k));
    next[i] = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    setPerPrize(next);
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
        <Field label={perWinner ? t.c_packages_all : t.c_packages}>
          <PackagePicker packages={packages} selected={selected} onToggle={toggle} />
        </Field>
      )}

      {packages.length > 0 && perWinner && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            {t.c_per_prize}
          </span>
          {prizes.map((prize, i) => (
            <Field key={i} label={`${i + 1}. ${prize}`}>
              <PackagePicker packages={packages} selected={slotOf(i)} onToggle={(id) => toggleSlot(i, id)} />
            </Field>
          ))}
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.c_per_prize_hint}</p>
        </div>
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

/**
 * The winner-selection picker.
 *
 * The hint only shows for FIRST_CLICK: that is where the meaning of the button
 * in the giveaway changes and three things work differently (no bonus entries,
 * no withdrawing, the duration as a deadline). RANDOM has nothing to explain.
 */
function DrawModeField({ mode, setMode, editing = false }: {
  mode: WinnerMode; setMode: (v: WinnerMode) => void; editing?: boolean;
}) {
  const { t } = useCtx();
  return (
    <Field label={t.f_draw_mode}>
      <select value={mode} onChange={(e) => setMode(e.target.value as WinnerMode)} className={selectCls}>
        <option value="RANDOM">{t.draw_random}</option>
        <option value="FIRST_CLICK">{t.draw_first_click}</option>
      </select>
      {mode === 'FIRST_CLICK' && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {t.draw_first_click_hint}
          {editing ? ` ${t.draw_first_click_edit_hint}` : ''}
        </p>
      )}
    </Field>
  );
}

/**
 * Badge on the cards. Only visible for FIRST_CLICK: a "draw at the end" line on
 * every card would be noise, the normal case needs no label.
 */
function DrawBadge({ mode }: { mode: WinnerMode | undefined }) {
  const { t } = useCtx();
  if (mode !== 'FIRST_CLICK') return null;
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--color-primary)]">
      <Zap className="h-3 w-3" /> {t.draw_badge_fast}
    </span>
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

/**
 * Coupon-Eingaben in das Format des Steuer-Endpunkts bringen.
 *
 * Die Auswahl je Gewinner wird auf die Anzahl der Preise gekürzt: streicht
 * jemand einen Preis, soll dessen Paketauswahl nicht als toter Eintrag
 * weiterleben und beim nächsten Hinzufügen wieder auftauchen.
 */
function couponPayload(
  percent: string, validDays: string, selected: number[], perPrize: number[][], prizeCount: number,
  manual: { code: string; perPrize: string[]; note: string },
) {
  return {
    couponPercent:   percent.trim() === '' ? null : Number(percent),
    couponValidDays: validDays.trim() === '' ? null : Number(validDays),
    couponPackages:  selected,
    couponPackagesPerPrize: Array.from({ length: prizeCount }, (_, i) => perPrize[i] ?? []),
    couponManualCode: manual.code.trim(),
    couponManualCodesPerPrize: Array.from({ length: prizeCount }, (_, i) => (manual.perPrize[i] ?? '').trim()),
    couponManualNote: manual.note.trim(),
  };
}

function CreateForm({ channels, roles, busy, onCreate, packages, couponReady, ownerHint, templates, settings }: {
  channels: Channel[]; roles: Role[]; busy: boolean; onCreate: (p: Record<string, unknown>) => void;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean; templates: Template[];
  settings: Settings | null;
}) {
  const { t } = useCtx();
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizes, setPrizes] = useState('');
  const [prizeMode, setPrizeMode] = useState<PrizeMode>('ALL');
  const [winnerMode, setWinnerMode] = useState<WinnerMode>('RANDOM');
  const [winnersCount, setWinnersCount] = useState(1);
  const [duration, setDuration] = useState('1d');
  const [fromTemplate, setFromTemplate] = useState('');
  const [percent, setPercent] = useState('');
  const [validDays, setValidDays] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [perPrize, setPerPrize] = useState<number[][]>([]);
  const [manualCode, setManualCode] = useState('');
  const [manualPerPrize, setManualPerPrize] = useState<string[]>([]);
  const [manualNote, setManualNote] = useState('');
  // Die Bedingungen ersetzen die serverweiten, deshalb stehen sie hier von
  // Anfang an drin: was im Formular steht, gilt danach für dieses Giveaway.
  // Leer vorbelegt würde das Anlegen jede Server-Einstellung stillschweigend
  // abschalten.
  const [blacklistRoles, setBlacklistRoles] = useState<string[]>(settings?.blacklist ?? []);
  const [whitelistRoles, setWhitelistRoles] = useState<string[]>(settings?.whitelist ?? []);
  const [bonusRoles, setBonusRoles] = useState<Record<string, number>>(settings?.bonusRoles ?? {});
  const prizeList = splitPrizes(prizes);

  function resetEligibility() {
    setBlacklistRoles(settings?.blacklist ?? []);
    setWhitelistRoles(settings?.whitelist ?? []);
    setBonusRoles(settings?.bonusRoles ?? {});
  }

  /**
   * Vorlage übernehmen: die Felder werden GEFÜLLT, nicht gesperrt.
   *
   * Eine Vorlage ist ein Startpunkt, kein Vertrag. Wer sie wählt und dann den
   * Titel ändert, meint das auch so — und der Kanal steht ohnehin nie drin.
   * Coupons bleiben unangetastet: die trägt eine Vorlage bewusst nicht, sie
   * hängen an Paket-IDs eines konkreten Stores und wären schnell veraltet.
   *
   * Bedingungen, zu denen die Vorlage nichts sagt (null), fallen zurück auf die
   * Server-Einstellungen — dieselbe Vorbelegung wie ohne Vorlage.
   */
  function applyTemplate(id: string) {
    setFromTemplate(id);
    const tpl = templates.find((x) => String(x.id) === id);
    if (!tpl) return;
    setTitle(tpl.title);
    setDescription(tpl.description);
    setPrizes(tpl.prizes.join('\n'));
    setPrizeMode(tpl.prizeMode);
    setWinnerMode(tpl.winnerMode ?? 'RANDOM');
    setWinnersCount(tpl.winnersCount);
    setDuration(tpl.duration);
    setBlacklistRoles(tpl.blacklistRoles ?? settings?.blacklist ?? []);
    setWhitelistRoles(tpl.whitelistRoles ?? settings?.whitelist ?? []);
    setBonusRoles(tpl.bonusRoles ?? settings?.bonusRoles ?? {});
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="font-semibold">{t.create_title}</h3>
      {templates.length > 0 && (
        <Field label={t.tpl_use}>
          <select value={fromTemplate} onChange={(e) => applyTemplate(e.target.value)} className={selectCls}>
            <option value="">{t.tpl_use_none}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>{tpl.name} · {tpl.title}</option>
            ))}
          </select>
          {fromTemplate && <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{t.tpl_applied}</p>}
        </Field>
      )}
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
      <DrawModeField mode={winnerMode} setMode={setWinnerMode} />
      <Field label={t.f_duration}><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1d2h30m" /></Field>

      <CouponFields
        percent={percent} setPercent={setPercent}
        validDays={validDays} setValidDays={setValidDays}
        selected={selected} setSelected={setSelected}
        perPrize={perPrize} setPerPrize={setPerPrize}
        prizes={prizeList} mode={prizeMode}
        packages={packages} couponReady={couponReady} ownerHint={ownerHint}
      />

      <ManualCodeFields
        code={manualCode} setCode={setManualCode}
        perPrize={manualPerPrize} setPerPrize={setManualPerPrize}
        note={manualNote} setNote={setManualNote}
        prizes={prizeList} mode={prizeMode}
      />

      <EligibilityFields
        roles={roles} onReset={resetEligibility}
        blacklist={blacklistRoles} setBlacklist={setBlacklistRoles}
        whitelist={whitelistRoles} setWhitelist={setWhitelistRoles}
        bonus={bonusRoles} setBonus={setBonusRoles}
      />

      <div className="flex justify-end">
        <Button size="sm" disabled={busy || !channelId || !title.trim() || !description.trim()}
          onClick={() => onCreate({
            channelId, title: title.trim(), description: description.trim(), duration,
            winnerMode,
            ...prizePayload(prizes, prizeMode, winnersCount),
            ...couponPayload(percent, validDays, selected, perPrize, prizeList.length,
              { code: manualCode, perPrize: manualPerPrize, note: manualNote }),
            ...eligibilityPayload(blacklistRoles, whitelistRoles, bonusRoles),
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

function EditButton({ giveaway, roles, settings, onSave, disabled, packages, couponReady, ownerHint }: {
  giveaway: Giveaway; roles: Role[]; settings: Settings | null;
  onSave: (p: Record<string, unknown>) => void; disabled?: boolean;
  packages: TebexPackage[]; couponReady: boolean; ownerHint: boolean;
}) {
  const { t } = useCtx();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(giveaway.title);
  const [description, setDescription] = useState(giveaway.description);
  const [prizes, setPrizes] = useState((giveaway.prizes ?? []).join('\n'));
  const [prizeMode, setPrizeMode] = useState<PrizeMode>(giveaway.prizeMode ?? 'ALL');
  const [winnerMode, setWinnerMode] = useState<WinnerMode>(giveaway.winnerMode ?? 'RANDOM');
  const [winnersCount, setWinnersCount] = useState(giveaway.winnersCount);
  const [percent, setPercent] = useState(giveaway.couponPercent == null ? '' : String(giveaway.couponPercent));
  const [validDays, setValidDays] = useState(giveaway.couponValidDays == null ? '' : String(giveaway.couponValidDays));
  const [selected, setSelected] = useState<number[]>(giveaway.couponPackages ?? []);
  const [perPrize, setPerPrize] = useState<number[][]>(giveaway.couponPackagesPerPrize ?? []);
  const [manualCode, setManualCode] = useState(giveaway.couponManualCode ?? '');
  const [manualPerPrize, setManualPerPrize] = useState<string[]>(giveaway.couponManualCodesPerPrize ?? []);
  const [manualNote, setManualNote] = useState(giveaway.couponManualNote ?? '');
  // null heißt "das Giveaway erbt" — dann stehen hier die Server-Einstellungen,
  // also das, was gerade tatsächlich gilt. Leer wäre schlicht falsch.
  const [blacklistRoles, setBlacklistRoles] = useState<string[]>(giveaway.blacklistRoles ?? settings?.blacklist ?? []);
  const [whitelistRoles, setWhitelistRoles] = useState<string[]>(giveaway.whitelistRoles ?? settings?.whitelist ?? []);
  const [bonusRoles, setBonusRoles] = useState<Record<string, number>>(giveaway.bonusRoles ?? settings?.bonusRoles ?? {});
  const prizeList = splitPrizes(prizes);

  function resetEligibility() {
    setBlacklistRoles(settings?.blacklist ?? []);
    setWhitelistRoles(settings?.whitelist ?? []);
    setBonusRoles(settings?.bonusRoles ?? {});
  }
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
      <DrawModeField mode={winnerMode} setMode={setWinnerMode} editing />
      <CouponFields
        percent={percent} setPercent={setPercent}
        validDays={validDays} setValidDays={setValidDays}
        selected={selected} setSelected={setSelected}
        perPrize={perPrize} setPerPrize={setPerPrize}
        prizes={prizeList} mode={prizeMode}
        packages={packages} couponReady={couponReady} ownerHint={ownerHint}
      />

      <ManualCodeFields
        code={manualCode} setCode={setManualCode}
        perPrize={manualPerPrize} setPerPrize={setManualPerPrize}
        note={manualNote} setNote={setManualNote}
        prizes={prizeList} mode={prizeMode}
      />

      <EligibilityFields
        roles={roles} onReset={resetEligibility}
        blacklist={blacklistRoles} setBlacklist={setBlacklistRoles}
        whitelist={whitelistRoles} setWhitelist={setWhitelistRoles}
        bonus={bonusRoles} setBonus={setBonusRoles}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{t.btn_cancel}</Button>
        <Button size="sm" disabled={disabled} onClick={() => {
          onSave({
            title, description, winnerMode,
            ...prizePayload(prizes, prizeMode, winnersCount),
            ...couponPayload(percent, validDays, selected, perPrize, prizeList.length,
              { code: manualCode, perPrize: manualPerPrize, note: manualNote }),
            ...eligibilityPayload(blacklistRoles, whitelistRoles, bonusRoles),
          });
          setOpen(false);
        }}>{t.btn_save}</Button>
      </div>
    </Card>
  );
}

// ── Vorlagen-Tab ──────────────────────────────────────────────────────────────

function TemplatesTab({ templates, roles, settings, reload, setError }: {
  templates: Template[]; roles: Role[]; settings: Settings | null;
  reload: () => Promise<void>; setError: (e: string | null) => void;
}) {
  const { t } = useCtx();
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);

  /**
   * Fehler des Bots in einen Satz übersetzen, den man lesen kann.
   * Alles Unbekannte behält den Rohwert: eine erfundene Beschriftung wäre
   * schlimmer als ein technischer Code, den man suchen kann.
   */
  function message(error: unknown): string {
    const known: Record<string, string> = {
      name_taken:      t.tpl_err_taken,
      template_limit:  t.tpl_err_limit,
      invalid_name:    t.tpl_err_name,
      invalid_duration: t.tpl_err_duration,
    };
    const key = String(error ?? '');
    return known[key] ?? `${t.err_prefix}: ${key || '?'}`;
  }

  async function act(action: string, payload: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/giveaway/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(message(data?.error));
        return false;
      }
      await reload();
      return true;
    } catch {
      setError(t.err_network);
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 text-sm text-[var(--color-muted-foreground)]">{t.tpl_hint}</Card>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing(editing === 'new' ? null : 'new')}>
          <Plus className="mr-2 h-4 w-4" /> {t.tpl_new}
        </Button>
      </div>

      {editing === 'new' && (
        <TemplateForm
          busy={busy === 'new'} roles={roles} settings={settings}
          onCancel={() => setEditing(null)}
          onSave={async (p) => { if (await act('templateSave', p, 'new')) setEditing(null); }}
        />
      )}

      {templates.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">{t.tpl_none}</Card>
      ) : (
        templates.map((tpl) => (
          <Card key={tpl.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--color-muted)] px-2 py-0.5 font-mono text-[0.625rem] font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                    {tpl.name}
                  </span>
                  <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                    {tpl.duration} · {tpl.winnersCount} {t.tpl_winners}
                  </span>
                </div>
                <p className="mt-1 truncate font-semibold">{tpl.title}</p>
                <DrawBadge mode={tpl.winnerMode} />
                {tpl.prizes.length > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                    {tpl.prizeMode === 'INDIVIDUAL'
                      ? tpl.prizes.map((p, i) => `${i + 1}. ${p}`).join(' · ')
                      : tpl.prizes.join(', ')}
                  </p>
                )}
                {/* Nur der Hinweis, dass die Vorlage eigene Bedingungen trägt.
                    Welche das sind, steht im Formular. */}
                {(tpl.blacklistRoles || tpl.whitelistRoles || tpl.bonusRoles) && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--color-muted-foreground)]">
                    <ShieldCheck className="h-3 w-3" /> {t.tpl_conditions}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(editing === tpl.id ? null : tpl.id)}>
                  <Pencil className="mr-2 h-4 w-4" /> {t.tpl_edit}
                </Button>
                {/* Als einzige Aktion im Dashboard mit Rückfrage: ein Giveaway
                    abzubrechen bleibt sichtbar und steht im Log, eine gelöschte
                    Vorlage ist samt ihrem getippten Text weg. */}
                <Button
                  variant="danger" size="sm"
                  disabled={busy === `del-${tpl.id}`}
                  onClick={() => { if (confirm(t.tpl_delete_ask)) act('templateDelete', { id: tpl.id }, `del-${tpl.id}`); }}
                >
                  {busy === `del-${tpl.id}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} {t.tpl_delete}
                </Button>
              </div>
            </div>

            {editing === tpl.id && (
              <TemplateForm
                template={tpl} roles={roles} settings={settings}
                busy={busy === `edit-${tpl.id}`}
                onCancel={() => setEditing(null)}
                onSave={async (p) => { if (await act('templateSave', { id: tpl.id, ...p }, `edit-${tpl.id}`)) setEditing(null); }}
              />
            )}
          </Card>
        ))
      )}
    </div>
  );
}

/**
 * Formular zum Anlegen und Bearbeiten.
 *
 * Bewusst dieselben Preis-Felder wie beim Giveaway (`PrizeFields`): eine
 * Vorlage, die Preise anders eingibt als das Giveaway, das aus ihr entsteht,
 * wäre eine zweite Vorstellung davon, was ein Preis ist.
 */
function TemplateForm({ template, roles, settings, busy, onSave, onCancel }: {
  template?: Template; roles: Role[]; settings: Settings | null; busy: boolean;
  onSave: (p: Record<string, unknown>) => void; onCancel: () => void;
}) {
  const { t } = useCtx();
  const [name, setName] = useState(template?.name ?? '');
  const [title, setTitle] = useState(template?.title ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [prizes, setPrizes] = useState((template?.prizes ?? []).join('\n'));
  const [prizeMode, setPrizeMode] = useState<PrizeMode>(template?.prizeMode ?? 'ALL');
  const [winnerMode, setWinnerMode] = useState<WinnerMode>(template?.winnerMode ?? 'RANDOM');
  const [winnersCount, setWinnersCount] = useState(template?.winnersCount ?? 1);
  const [duration, setDuration] = useState(template?.duration ?? '1d');

  /**
   * Anders als beim Giveaway ist "erben" hier die Voreinstellung.
   *
   * Eine Vorlage lebt Monate. Die Server-Einstellungen hier einzufrieren würde
   * heißen, dass jedes Giveaway aus ihr eine spätere Änderung daran nicht
   * mitbekommt — genau der Grund, warum auch die Coupons nicht in eine Vorlage
   * gehören. Wer eigene Bedingungen will, schaltet sie ein.
   */
  const [ownConditions, setOwnConditions] = useState(
    Boolean(template?.blacklistRoles || template?.whitelistRoles || template?.bonusRoles),
  );
  const [blacklistRoles, setBlacklistRoles] = useState<string[]>(template?.blacklistRoles ?? settings?.blacklist ?? []);
  const [whitelistRoles, setWhitelistRoles] = useState<string[]>(template?.whitelistRoles ?? settings?.whitelist ?? []);
  const [bonusRoles, setBonusRoles] = useState<Record<string, number>>(template?.bonusRoles ?? settings?.bonusRoles ?? {});

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-4">
      <Field label={t.tpl_name}>
        <Input value={name} maxLength={64} placeholder={t.tpl_name_ph} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t.f_title}><Input value={title} maxLength={256} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={t.f_description}>
        <textarea value={description} maxLength={2000} rows={3} onChange={(e) => setDescription(e.target.value)} className={selectCls} />
      </Field>
      <PrizeFields
        prizes={prizes} setPrizes={setPrizes}
        mode={prizeMode} setMode={setPrizeMode}
        winnersCount={winnersCount} setWinnersCount={setWinnersCount}
      />
      <DrawModeField mode={winnerMode} setMode={setWinnerMode} />
      <Field label={t.f_duration}>
        <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1d2h30m" />
      </Field>

      <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={ownConditions} onChange={(e) => setOwnConditions(e.target.checked)} />
          {t.tpl_own_conditions}
        </label>
        <p className="text-xs text-[var(--color-muted-foreground)]">{t.tpl_own_hint}</p>
        {ownConditions && (
          <EligibilityFields
            roles={roles}
            blacklist={blacklistRoles} setBlacklist={setBlacklistRoles}
            whitelist={whitelistRoles} setWhitelist={setWhitelistRoles}
            bonus={bonusRoles} setBonus={setBonusRoles}
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>{t.tpl_cancel}</Button>
        <Button
          size="sm"
          disabled={busy || !name.trim() || !title.trim() || !description.trim() || !duration.trim()}
          onClick={() => onSave({
            name: name.trim(), title: title.trim(), description: description.trim(), duration: duration.trim(),
            winnerMode,
            ...prizePayload(prizes, prizeMode, winnersCount),
            // Ausgeschaltet heißt null, nicht leere Liste: leer wäre eine eigene
            // Bedingung ("hier gilt keine"), null lässt die Server-Einstellung gelten.
            ...(ownConditions
              ? eligibilityPayload(blacklistRoles, whitelistRoles, bonusRoles)
              : { blacklistRoles: null, whitelistRoles: null, bonusRoles: null }),
          })}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {t.tpl_save}
        </Button>
      </div>
    </div>
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
          bonusRoles: clampBonus(form.bonusRoles),
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
            {['en', 'de', 'fr', 'es', 'hu', 'pl', 'pt'].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
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
      <Field label={t.s_bonus}>
        <BonusRoleEditor roles={roles} value={form.bonusRoles ?? {}} onChange={(v) => upd({ bonusRoles: v })} />
        <span className="text-xs text-[var(--color-muted-foreground)]">{t.s_bonus_hint}</span>
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
          <div role="alert" className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
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

/**
 * Bonus-Lose je Rolle.
 *
 * Anders als Blacklist und Whitelist ist das keine Mehrfachauswahl, sondern eine
 * Zuordnung: jede Rolle trägt eine Anzahl. Deshalb eine Zeile pro Rolle statt
 * einer Chip-Wolke, sonst wäre nirgends abzulesen, wie viele Lose dranhängen.
 */
function BonusRoleEditor({ roles, value, onChange }: {
  roles: Role[]; value: Record<string, number>; onChange: (v: Record<string, number>) => void;
}) {
  const { t } = useCtx();
  const current = value ?? {};
  const entries = Object.entries(current);
  const available = roles.filter((r) => !(r.id in current));

  const set = (id: string, amount: number) => onChange({ ...current, [id]: amount });
  const remove = (id: string) => {
    const next = { ...current };
    delete next[id];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2">
      {entries.length === 0 && <span className="text-xs text-[var(--color-muted-foreground)]">{t.s_bonus_none}</span>}
      {entries.map(([id, amount]) => (
        <div key={id} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs">@ {roles.find((r) => r.id === id)?.name ?? id}</span>
          <span className="font-mono text-xs text-[var(--color-muted-foreground)]">+</span>
          <Input
            type="number" min={MIN_BONUS} max={MAX_BONUS} value={amount} className="h-8 w-20"
            onChange={(e) => set(id, Number(e.target.value))}
          />
          <button
            type="button" aria-label={t.s_bonus_remove} onClick={() => remove(id)}
            className="rounded p-1 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-danger)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {available.length > 0 && (
        // Der Wert bleibt leer: die Auswahl ist ein Knopf zum Hinzufügen, kein Zustand.
        <select value="" className={selectCls} onChange={(e) => { if (e.target.value) set(e.target.value, MIN_BONUS); }}>
          <option value="">{t.s_bonus_add}</option>
          {available.map((r) => <option key={r.id} value={r.id}>@ {r.name}</option>)}
        </select>
      )}
    </div>
  );
}

/**
 * Bedingungen für ein einzelnes Giveaway.
 *
 * Sie ERSETZEN die serverweiten Einstellungen für dieses Giveaway, jedes Feld
 * für sich. Deshalb sind die Felder mit genau diesen Einstellungen vorbelegt:
 * so ändert nichts anzufassen auch nichts, und wer eine serverweite Rolle
 * herausnimmt, hebt sie hier gezielt auf. Der Hinweis über den Feldern sagt
 * dasselbe, sonst liest sich das Formular wie eine Ergänzung.
 */
function EligibilityFields({ roles, blacklist, setBlacklist, whitelist, setWhitelist, bonus, setBonus, onReset }: {
  roles: Role[];
  blacklist: string[]; setBlacklist: (v: string[]) => void;
  whitelist: string[]; setWhitelist: (v: string[]) => void;
  bonus: Record<string, number>; setBonus: (v: Record<string, number>) => void;
  onReset?: () => void;
}) {
  const { t } = useCtx();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{t.elig_title}</h4>
          <p className="text-xs text-[var(--color-muted-foreground)]">{t.elig_hint}</p>
        </div>
        {onReset && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={onReset}>{t.elig_reset}</Button>
        )}
      </div>
      <Field label={t.s_blacklist}>
        <RoleMultiSelect roles={roles} value={blacklist} onChange={setBlacklist} />
      </Field>
      <Field label={t.s_whitelist}>
        <RoleMultiSelect roles={roles} value={whitelist} onChange={setWhitelist} />
      </Field>
      <Field label={t.s_bonus}>
        <BonusRoleEditor roles={roles} value={bonus} onChange={setBonus} />
      </Field>
    </div>
  );
}

/** Bedingungs-Eingaben in das Format des Steuer-Endpunkts bringen. */
function eligibilityPayload(blacklist: string[], whitelist: string[], bonus: Record<string, number>) {
  return {
    blacklistRoles: blacklist,
    whitelistRoles: whitelist,
    // Der Bot lehnt alles außerhalb von 1 bis 100 ab. Beim Tippen darf im Feld
    // trotzdem kurz etwas anderes stehen, geklemmt wird deshalb erst hier.
    bonusRoles: clampBonus(bonus),
  };
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
