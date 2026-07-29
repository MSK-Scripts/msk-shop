import { cookies }          from 'next/headers';
import { parseSession }     from '@/lib/session';
import VerifyClient         from './VerifyClient';

// Session-/Cookie-abhängig → niemals statisch/route-cachen.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Verify Server',
  robots: { index: false, follow: false },
  description: 'Link your Discord server to receive your MSK Ticket Bot API key.',
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; error?: string }>
}) {
  const params      = await searchParams;
  const cookieStore = await cookies();
  const sessionRaw  = cookieStore.get('msk_verify_session')?.value;
  const session     = sessionRaw ? parseSession(sessionRaw) : null;

  return (
    <VerifyClient
      session={session}
      step={params.step ?? null}
      errorCode={params.error ?? null}
    />
  )
}
