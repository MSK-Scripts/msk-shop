'use client';

import { useState }   from 'react';
import { useRouter }  from 'next/navigation';
import { Gift, LogIn, ShieldCheck } from 'lucide-react';
import { giveawayDashboardTranslations } from '@/lib/i18n';
import { useLang }    from '@/components/i18n/LangProvider';
import { Card }       from '@/components/ui/Card';
import { Button }     from '@/components/ui/Button';
import { cn }         from '@/lib/utils';

interface Guild { id: string; name: string; icon: string | null }

export default function VerifyClient({ step, guilds }: { step: 'login' | 'select'; guilds: Guild[] }) {
  const router = useRouter();
  const { lang } = useLang();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = giveawayDashboardTranslations[lang];

  async function select(guildId: string) {
    setBusy(guildId);
    setError(null);
    try {
      const res = await fetch('/api/giveaway/verify/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ guildId }),
      });
      if (res.ok) { router.push('/giveaway/dashboard'); return; }
      setError(
        res.status === 401 ? t.v_err_unauthorized :
        res.status === 403 ? t.v_err_forbidden :
        res.status === 404 ? t.v_err_not_found :
        t.v_err_generic,
      );
      setBusy(null);
    } catch {
      setError(t.v_err_network);
      setBusy(null);
    }
  }

  return (
    // Kein zweites <main>: das Root-Layout rendert bereits eines, und zwei
    // davon sind im Dokument nicht erlaubt.
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          <Gift className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.dashboard_title}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{t.v_subtitle}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 w-full rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      )}

      {step === 'login' && (
        <Button variant="discord" size="lg" asChild>
          <a href="/api/giveaway/auth">
            <LogIn className="mr-2 h-4 w-4" /> {t.v_login_btn}
          </a>
        </Button>
      )}

      {step === 'select' && (
        <div className="w-full">
          {guilds.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-8 text-center">
              <ShieldCheck className="h-8 w-8 text-[var(--color-muted-foreground)]" />
              <p className="text-sm text-[var(--color-muted-foreground)]">{t.v_no_guilds}</p>
              <Button variant="outline" asChild>
                <a href="/giveaway">{t.v_back}</a>
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {/* War ein <p>, ist aber die Überschrift über der Serverliste. */}
              <h2
                className="mb-1 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]"
              >
                {t.v_select_server}
              </h2>
              {guilds.map((g) => (
                <button
                  key={g.id}
                  onClick={() => select(g.id)}
                  disabled={busy !== null}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-left transition-colors',
                    'hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-muted)] disabled:opacity-50',
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-muted)] text-xs font-bold uppercase">
                    {g.icon
                      ? // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`} alt="" className="h-full w-full object-cover" />
                      : g.name.slice(0, 2)}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">{g.name}</span>
                  {busy === g.id && <span className="text-xs text-[var(--color-muted-foreground)]">…</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
