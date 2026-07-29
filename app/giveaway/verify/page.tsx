import { cookies } from 'next/headers';
import { parseGiveawayVerify } from '@/lib/giveawaySession';
import { giveawayQuery }     from '@/lib/giveawayDb';
import VerifyClient          from './VerifyClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Giveaway Dashboard Login',
  robots: { index: false, follow: false },
};

interface BotGuild { id: string; name: string; icon: string | null }

export default async function GiveawayVerifyPage() {
  const cookieStore = await cookies();
  const session = parseGiveawayVerify(cookieStore.get('msk_gw_verify')?.value);

  // Noch nicht via Discord eingeloggt → Login-Schritt.
  if (!session?.guilds || !session.discordUserId) {
    return <VerifyClient step="login" guilds={[]} />;
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

  return <VerifyClient step="select" guilds={botGuilds} />;
}
