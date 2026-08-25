import { giveawayQuery, giveawayQueryOne } from '@/lib/giveawayDb';

// Shared loader for the public, anonymous Giveaway-Bot statistics.
// Used by both the server-rendered page (initial load) and the live API route
// the client polls. All numbers are aggregate counts — no guild IDs, user IDs
// or other personal data ever leave the database.

export interface GiveawayStats {
  available:       boolean;
  servers:         number;                  // GuildSettings rows
  giveaways:       number;                  // Giveaway rows (all statuses)
  activeGiveaways: number;                  // status = ACTIVE
  entries:         number;                  // Entry rows
  winners:         number;                  // Winner rows
  templates:       number;                  // GiveawayTemplate rows
  avgEntries:      number;                  // entries / giveaways, rounded
  maxEntries:      number;                  // most entries on a single giveaway
  langs:           Record<string, number>;  // en / de / fr / es / hu / pl / pt
  status:          Record<string, number>;  // ACTIVE / PAUSED / ENDED / CANCELLED
}

interface CountRow  { total: number }
interface GroupRow  { k: string; count: number }

export const EMPTY_GIVEAWAY_STATS: GiveawayStats = {
  available:       false,
  servers:         0,
  giveaways:       0,
  activeGiveaways: 0,
  entries:         0,
  winners:         0,
  templates:       0,
  avgEntries:      0,
  maxEntries:      0,
  langs:           { en: 0, de: 0, fr: 0, es: 0, hu: 0, pl: 0, pt: 0 },
  status:          { ACTIVE: 0, PAUSED: 0, ENDED: 0, CANCELLED: 0 },
};

export async function loadGiveawayStats(): Promise<GiveawayStats> {
  try {
    const [
      servers,
      giveaways,
      activeGiveaways,
      entries,
      winners,
      templates,
      maxEntries,
      langRows,
      statusRows,
    ] = await Promise.all([
      giveawayQueryOne<CountRow>('SELECT COUNT(*) AS total FROM `GuildSettings`'),
      giveawayQueryOne<CountRow>('SELECT COUNT(*) AS total FROM `Giveaway`'),
      giveawayQueryOne<CountRow>("SELECT COUNT(*) AS total FROM `Giveaway` WHERE status = 'ACTIVE'"),
      giveawayQueryOne<CountRow>('SELECT COUNT(*) AS total FROM `Entry`'),
      giveawayQueryOne<CountRow>('SELECT COUNT(*) AS total FROM `Winner`'),
      giveawayQueryOne<CountRow>('SELECT COUNT(*) AS total FROM `GiveawayTemplate`'),
      giveawayQueryOne<CountRow>(
        'SELECT COUNT(*) AS total FROM `Entry` GROUP BY giveawayId ORDER BY total DESC LIMIT 1',
      ),
      giveawayQuery<GroupRow>('SELECT lang AS k, COUNT(*) AS count FROM `GuildSettings` GROUP BY lang'),
      giveawayQuery<GroupRow>('SELECT status AS k, COUNT(*) AS count FROM `Giveaway` GROUP BY status'),
    ]);

    const giveawaysTotal = Number(giveaways?.total ?? 0);
    const entriesTotal   = Number(entries?.total ?? 0);

    const langs = { ...EMPTY_GIVEAWAY_STATS.langs };
    for (const row of langRows) {
      const key = String(row.k ?? '').toLowerCase();
      if (key) langs[key] = (langs[key] ?? 0) + Number(row.count);
    }

    const status = { ...EMPTY_GIVEAWAY_STATS.status };
    for (const row of statusRows) {
      const key = String(row.k ?? '').toUpperCase();
      if (key) status[key] = (status[key] ?? 0) + Number(row.count);
    }

    return {
      available:       true,
      servers:         Number(servers?.total ?? 0),
      giveaways:       giveawaysTotal,
      activeGiveaways: Number(activeGiveaways?.total ?? 0),
      entries:         entriesTotal,
      winners:         Number(winners?.total ?? 0),
      templates:       Number(templates?.total ?? 0),
      avgEntries:      giveawaysTotal > 0 ? Math.round(entriesTotal / giveawaysTotal) : 0,
      maxEntries:      Number(maxEntries?.total ?? 0),
      langs,
      status,
    };
  } catch (err) {
    console.error('[GiveawayStats] DB error:', err);
    return EMPTY_GIVEAWAY_STATS;
  }
}
