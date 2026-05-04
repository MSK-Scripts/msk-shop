import { cookies }       from 'next/headers';
import { parseSession }  from '@/lib/session';
import VerifyClient      from './VerifyClient';

export const metadata = {
  title: 'Server verifizieren – MSK Scripts',
  description: 'Verknüpfe deinen GitHub-Account und Discord-Server um deinen Ticket Bot API Key zu erhalten.',
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
