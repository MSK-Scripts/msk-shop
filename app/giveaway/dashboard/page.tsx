import { cookies, headers }                  from 'next/headers';
import { redirect }                          from 'next/navigation';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import { LANG_COOKIE_NAME, resolveLang }     from '@/lib/lang';
import DashboardClient                       from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Giveaway Dashboard – MSK Scripts',
};

export default async function GiveawayDashboardPage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const session = parseGiveawaySession(cookieStore.get(GIVEAWAY_SESSION_COOKIE)?.value);

  if (!session?.guildId) {
    redirect('/giveaway/verify');
  }

  const initialLang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, headerStore.get('accept-language'));
  return <DashboardClient guildId={session.guildId} initialLang={initialLang} />;
}
