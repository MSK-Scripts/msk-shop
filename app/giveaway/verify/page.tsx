import { cookies, headers } from 'next/headers';
import { parseGiveawayVerify } from '@/lib/giveawaySession';
import { giveawayQuery }     from '@/lib/giveawayDb';
import { LANG_COOKIE_NAME, resolveLang } from '@/lib/lang';
import VerifyClient          from './VerifyClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Giveaway Dashboard – Login – MSK Scripts',
};

interface BotGuild { id: string; name: string; icon: string | null }

export default async function GiveawayVerifyPage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const session = parseGiveawayVerify(cookieStore.get('msk_gw_verify')?.value);
  const initialLang = resolveLang(cookieStore.get(LANG_COOKIE_NAME)?.value, headerStore.get('accept-language'));

  // Noch nicht via Discord eingeloggt → Login-Schritt.
  if (!session?.guilds || !session.discordUserId) {
    return <VerifyClient step="login" guilds={[]} initialLang={initialLang} />;
  }

  // Admin-Guilds auf die einschränken, in denen der Bot ist (GuildSettings-Row).
  const adminGuilds = session.guilds;
  let botGuilds: BotGuild[] = [];
  if (adminGuilds.length > 0) {
    const ids = adminGuilds.map((g) => g.id);
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await giveawayQuery<{ guildId: string }>(
      `SELECT guildId FROM \`GuildSettings\` WHERE guildId IN (${placeholders})`,
      ids,
    );
    const present = new Set(rows.map((r) => r.guildId));
    botGuilds = adminGuilds.filter((g) => present.has(g.id));
  }

  return <VerifyClient step="select" guilds={botGuilds} initialLang={initialLang} />;
}
