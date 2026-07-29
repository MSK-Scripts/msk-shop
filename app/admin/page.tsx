import { cookies }                            from 'next/headers';
import { parseAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';
import { loadAdminMember }                      from '@/lib/adminAuth';
import { Button }                               from '@/components/ui/Button';
import { Card }                                 from '@/components/ui/Card';
import AdminClient                              from './AdminClient';

// Session-/cookie-dependent → never statically cache.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized:       'This Discord account is not on the admin team.',
  invalid_state:        'Login session expired. Please try again.',
  discord_token_failed: 'Discord login failed. Please try again.',
  discord_user_failed:  'Could not read your Discord account. Please try again.',
  seed_failed:          'Setup error while creating the owner account. Check the server logs.',
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const token       = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session     = token ? parseAdminSession(token) : null;
  const member      = session?.discordUserId ? await loadAdminMember(session.discordUserId) : null;

  if (member) {
    return <AdminClient member={member} />;
  }

  // Login gate
  const { error } = await searchParams;
  const message   = error ? ERROR_MESSAGES[error] ?? 'Login failed. Please try again.' : null;

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Sign in with the authorized Discord account to manage the store.
        </p>

        {message && (
          <p className="mt-4 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {message}
          </p>
        )}

        <Button asChild variant="discord" size="lg" className="mt-6 w-full">
          <a href="/api/admin/auth">Sign in with Discord</a>
        </Button>
      </Card>
    </div>
  );
}
