import { redirect }            from 'next/navigation';
import { publicPath }          from '@/lib/routes';
import { ticketBotHref }       from '@/lib/dashboardNav';
import { loadTicketBotGuilds } from './loadGuilds';

// Session/cookie dependent + server-side redirect() → never cache statically/per route.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

/**
 * The address of the dashboard before Phase 7, and still the one every link,
 * e-mail, Stripe return and OAuth callback points at. Since each server has
 * an address of its own, this only sends the visitor on: to the sign-in
 * without a session (inside the loader), to the overview of their first
 * server with one, which is the server the old single page opened with.
 */
export default async function TicketBotDashboardEntry() {
  const { lang, guilds } = await loadTicketBotGuilds();
  redirect(publicPath(lang, ticketBotHref(guilds[0].guild_id, 'overview')));
}
