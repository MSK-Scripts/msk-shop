import { notFound }    from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { Trophy, Gift, Users, CalendarClock } from 'lucide-react';
import { queryOne }     from '@/lib/db';
import { Card }         from '@/components/ui/Card';
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang';
import { giveawayResultTranslations } from '@/lib/i18n';
import LangToggle       from './LangToggle';

export const dynamic = 'force-dynamic';

interface ResultRow {
  token: string; giveaway_id: string; title: string; prize: string | null;
  winners_count: number; entry_count: number; winners: unknown; ended_at: string | Date;
}
interface Winner { username: string }

function parseWinners(raw: unknown): Winner[] {
  let arr: unknown = raw;
  if (typeof raw === 'string') { try { arr = JSON.parse(raw); } catch { arr = []; } }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((w): w is { username: unknown } => !!w && typeof (w as Winner).username === 'string')
    .map((w) => ({ username: String(w.username) }));
}

// Bewusst KEINE SEO/OpenGraph für die Ergebnis-Seiten: nicht indexieren und
// keine Link-Vorschau. (In Discord wird die Vorschau zusätzlich bot-seitig per
// SuppressEmbeds unterdrückt.)
export const metadata = {
  title: 'Giveaway Results',
  robots: { index: false, follow: false },
};

export default async function GiveawayResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();

  const [row, cookieStore, headerStore] = await Promise.all([
    queryOne<ResultRow>('SELECT * FROM giveaway_results WHERE token = ?', [token]),
    cookies(),
    headers(),
  ]);
  if (!row) notFound();

  const lang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, headerStore.get('accept-language'));
  const t = giveawayResultTranslations[lang];
  const winners = parseWinners(row.winners);
  const endedAt = new Date(row.ended_at);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <div className="mb-6 flex justify-end">
        <LangToggle lang={lang} />
      </div>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          <Gift className="h-7 w-7" />
        </div>
        <p className="font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">{t.results}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{row.title}</h1>
        {row.prize && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
            <Gift className="h-4 w-4" /> {t.prize}: <span className="font-medium text-[var(--color-foreground)]">{row.prize}</span>
          </p>
        )}
        <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">
          {t.giveaway_id}: {row.giveaway_id}
        </p>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2 font-mono text-[0.625rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
          <Trophy className="h-4 w-4 text-[var(--color-primary)]" /> {t.winners}
        </div>
        {winners.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{t.none}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {winners.map((w, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-bold text-[var(--color-primary)]">★</span>
                <span className="text-sm font-medium">{w.username}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Users className="h-4 w-4" /> {t.entries}: <span className="font-medium text-[var(--color-foreground)]">{row.entry_count}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <CalendarClock className="h-4 w-4" /> {t.ended}: <span className="font-medium text-[var(--color-foreground)]">{endedAt.toLocaleDateString(lang)}</span>
          </div>
        </div>
      </Card>

      <p className="mt-6 text-center font-mono text-[0.625rem] uppercase tracking-widest text-[var(--color-muted-foreground)]">{t.footer}</p>
    </main>
  );
}
