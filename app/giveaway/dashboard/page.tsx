import { cookies }                           from 'next/headers';
import { redirect }                          from 'next/navigation';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import DashboardClient                       from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Giveaway Dashboard',
  robots: { index: false, follow: false },
};

export default async function GiveawayDashboardPage() {
  const cookieStore = await cookies();
  const session = parseGiveawaySession(cookieStore.get(GIVEAWAY_SESSION_COOKIE)?.value);

  if (!session?.guildId) {
    redirect('/giveaway/verify');
  }

  // `owner` only controls whether the Tebex section is shown at all. The bot
  // checks the permission itself against guild.ownerId, so a tampered
  // cookie would gain nothing here.
  return <DashboardClient guildId={session.guildId} owner={Boolean(session.owner)} />;
}
