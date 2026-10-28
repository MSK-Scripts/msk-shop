import { cookies }          from 'next/headers';
import { parseSession }     from '@/lib/session';
import VerifyClient         from './VerifyClient';
import { TicketBotShell }   from '../TicketBotShell';

// Session/cookie dependent → never cache statically/per route.
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

  // Signed out of the dashboard: the shell without navigation or servers.
  return (
    <TicketBotShell servers={[]} currentId={null}>
      <VerifyClient
        session={session}
        step={params.step ?? null}
        errorCode={params.error ?? null}
      />
    </TicketBotShell>
  )
}
