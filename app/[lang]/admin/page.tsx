import { cookies }                            from 'next/headers';
import { getRequestLang }                     from '@/lib/serverLang';
import { parseAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';
import { loadAdminMember }                      from '@/lib/adminAuth';
import { Button }                               from '@/components/ui/Button';
import { Card }                                 from '@/components/ui/Card';
import { adminCopy }                            from '@/lib/i18n';
import AdminClient                              from './AdminClient';
import { AdminShell }                           from './AdminShell';

// Session-/cookie-dependent → never statically cache.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string }>;
}) {
  const cookieStore = await cookies();
  const token       = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const { lang }    = await getRequestLang();
  const session     = token ? parseAdminSession(token) : null;
  const member      = session?.discordUserId ? await loadAdminMember(session.discordUserId) : null;

  // `tab` is read here on the server and not in the client from `window`.
  // Otherwise the server would render "Overview" and the client something else
  // after a reload, and that is exactly a hydration mismatch. The request is
  // still only checked over there against the member's permissions.
  const { error, tab } = await searchParams;

  if (member) {
    return <AdminClient member={member} initialTab={tab} />;
  }

  // Login gate. The messages come from the table: `error` is only ever a key
  // into it, never text that ends up on the page.
  const c         = adminCopy(lang);
  const message   = error ? c.login_errors[error] ?? c.login_error_fallback : null;

  return (
    <AdminShell>
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="font-display text-h3 font-bold tracking-tight">{c.login_title}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          {c.login_intro}
        </p>

        {message && (
          <p role="alert" className="mt-4 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {message}
          </p>
        )}

        {/*
          The dashboard is single-language, its address is not: the proxy answers
          `/de/admin` just the same. Without this parameter the OAuth round trip
          sends everyone to `/admin`, and somebody who was browsing in German
          gets English for the rest of the session. Only the language is passed,
          never a destination: a forwarded path would be an open redirect.
        */}
        <Button asChild variant="discord" size="lg" className="mt-6 w-full">
          <a href={lang === 'de' ? '/api/admin/auth?lang=de' : '/api/admin/auth'}>
            {c.login_button}
          </a>
        </Button>
      </Card>
    </div>
    </AdminShell>
  );
}
