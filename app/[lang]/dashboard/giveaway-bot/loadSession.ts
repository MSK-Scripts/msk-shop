import { cache }          from 'react';
import { cookies }        from 'next/headers';
import { redirect }       from 'next/navigation';
import { getRequestLang } from '@/lib/serverLang';
import { publicPath }     from '@/lib/routes';
import { parseGiveawaySession, GIVEAWAY_SESSION_COOKIE } from '@/lib/giveawaySession';
import type { Lang }      from '@/lib/i18n';

/**
 * The signed giveaway session, for the layout and every page of the
 * signed-in dashboard. Without one the visitor goes to the sign-in, in the
 * language of the dashboard.
 *
 * Moved here unchanged from the old single `page.tsx` in Phase 7, when each
 * area got an address of its own; `cache()` reads the cookie once per request.
 * The guild is the one in the session, there is no server in the address.
 */
export const loadGiveawaySession = cache(async (): Promise<{ lang: Lang; guildId: string; owner: boolean }> => {
  // Every way out of here stays in the language of the dashboard.
  const { lang } = await getRequestLang();
  const cookieStore = await cookies();
  const session = parseGiveawaySession(cookieStore.get(GIVEAWAY_SESSION_COOKIE)?.value);

  if (!session?.guildId) {
    redirect(publicPath(lang, '/dashboard/giveaway-bot/verify'));
  }

  // `owner` only controls whether the Tebex section is shown at all. The bot
  // checks the permission itself against guild.ownerId, so a tampered
  // cookie would gain nothing here.
  return { lang, guildId: session.guildId, owner: Boolean(session.owner) };
});
