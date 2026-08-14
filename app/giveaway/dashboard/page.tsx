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

  // `owner` steuert nur, ob der Tebex-Bereich überhaupt angezeigt wird. Die
  // Berechtigung prüft der Bot selbst gegen guild.ownerId, ein manipuliertes
  // Cookie brächte hier also nichts.
  return <DashboardClient guildId={session.guildId} owner={Boolean(session.owner)} />;
}
