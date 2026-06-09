import { cookies, headers } from 'next/headers';
import { parseSession }     from '@/lib/session';
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang';
import VerifyClient         from './VerifyClient';

// Session-/Cookie-abhängig → niemals statisch/route-cachen.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Verify Server – MSK Scripts',
  description: 'Link your GitHub account and Discord server to receive your MSK Ticket Bot API key.',
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string }>
}) {
  const params      = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;
  const initialLang = resolveLang(
    cookieStore.get(LANG_COOKIE_NAME)?.value,
    headerStore.get('accept-language'),
  );

  return (
    <VerifyClient
      session={session}
      step={params.step ?? null}
      errorCode={params.error ?? null}
      initialLang={initialLang}
    />
  )
}
