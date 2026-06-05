import mysql from 'mysql2/promise';

// Separate, read-only connection pool for the Giveaway-Bot database.
//
// The Giveaway-Bot stores its data in its own MariaDB database (`giveaway_bot`,
// Prisma-managed) — distinct from the msk-shop database. We connect with a
// dedicated, least-privilege read-only user (SELECT only) so the public stats
// page can aggregate anonymous numbers without sharing the shop's DB user.
//
// Both databases live on the same MariaDB server, so host/port fall back to the
// shop's DB_HOST/DB_PORT if no Giveaway-specific overrides are set.
let pool: mysql.Pool | null = null;

export function getGiveawayPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.GIVEAWAY_DB_HOST     ?? process.env.DB_HOST ?? 'localhost',
      port:               Number(process.env.GIVEAWAY_DB_PORT ?? process.env.DB_PORT ?? 3306),
      user:               process.env.GIVEAWAY_DB_USER     ?? '',
      password:           process.env.GIVEAWAY_DB_PASSWORD ?? '',
      database:           process.env.GIVEAWAY_DB_NAME     ?? 'giveaway_bot',
      waitForConnections: true,
      connectionLimit:    5,
      queueLimit:         0,
      timezone:           '+00:00',
    });
  }
  return pool;
}

export async function giveawayQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows] = await getGiveawayPool().execute(sql, params as any);
  return rows as T[];
}

export async function giveawayQueryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await giveawayQuery<T>(sql, params);
  return rows[0] ?? null;
}
